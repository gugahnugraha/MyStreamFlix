/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Live TV Channel Health Check API
 * POST /api/livetv/health
 * 
 * Accepts a list of channel URLs and checks if each stream is reachable
 * by performing a lightweight HEAD/GET request with a short timeout.
 * Returns a map of URL -> status (online/offline/error).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/src/lib/session";

interface ChannelCheckRequest {
  channels: {
    id: string;
    url: string;
  }[];
}

interface ChannelStatus {
  id: string;
  url: string;
  status: "online" | "offline" | "error";
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

function isBlockedStreamHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body: ChannelCheckRequest = await request.json();

    if (!body.channels || !Array.isArray(body.channels)) {
      return NextResponse.json(
        { error: "Missing 'channels' array in request body." },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH = 50;
    const channelsToCheck = body.channels.slice(0, MAX_BATCH);

    // Check all channels concurrently with individual timeouts
    const results: ChannelStatus[] = await Promise.all(
      channelsToCheck.map(async (ch) => {
        const startTime = Date.now();
        try {
          if (!ch.url || (!ch.url.startsWith("http://") && !ch.url.startsWith("https://"))) {
            return {
              id: ch.id,
              url: ch.url,
              status: "error" as const,
              error: "Invalid URL format",
            };
          }

          const parsedUrl = new URL(ch.url);
          if (isBlockedStreamHost(parsedUrl.hostname)) {
            return {
              id: ch.id,
              url: ch.url,
              status: "error" as const,
              error: "Local or private network URLs are blocked",
            };
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

          const res = await fetch(ch.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; FlixSphere-HealthCheck/1.0)",
            },
          });

          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;

          // For HLS streams, status 200 and some 3xx are valid
          if (res.ok || res.status === 302 || res.status === 301) {
            return {
              id: ch.id,
              url: ch.url,
              status: "online" as const,
              statusCode: res.status,
              responseTime,
            };
          }

          // Some servers don't support HEAD, try GET with range header
          if (res.status === 405 || res.status === 403) {
            const controller2 = new AbortController();
            const timeout2 = setTimeout(() => controller2.abort(), 8000);

            const getRes = await fetch(ch.url, {
              method: "GET",
              signal: controller2.signal,
              redirect: "follow",
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; FlixSphere-HealthCheck/1.0)",
                "Range": "bytes=0-1023", // Only fetch first 1KB
              },
            });

            clearTimeout(timeout2);
            const getResponseTime = Date.now() - startTime;

            if (getRes.ok || getRes.status === 206 || getRes.status === 302 || getRes.status === 301) {
              return {
                id: ch.id,
                url: ch.url,
                status: "online" as const,
                statusCode: getRes.status,
                responseTime: getResponseTime,
              };
            }

            return {
              id: ch.id,
              url: ch.url,
              status: "offline" as const,
              statusCode: getRes.status,
              responseTime: getResponseTime,
            };
          }

          return {
            id: ch.id,
            url: ch.url,
            status: "offline" as const,
            statusCode: res.status,
            responseTime,
          };
        } catch (err: any) {
          const responseTime = Date.now() - startTime;
          const isTimeout = err.name === "AbortError";
          return {
            id: ch.id,
            url: ch.url,
            status: "offline" as const,
            responseTime,
            error: isTimeout ? "Connection timed out (8s)" : (err.message || "Network error"),
          };
        }
      })
    );

    // Summary stats
    const online = results.filter((r) => r.status === "online").length;
    const offline = results.filter((r) => r.status === "offline").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        online,
        offline,
        errors,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Health check failed." },
      { status: 500 }
    );
  }
}
