/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IPTV Playlist Scanner & M3U Parser API
 * Fetches and parses M3U/M3U8 playlists from IPTV sources server-side (avoids CORS).
 * Supports iptv-org and custom M3U playlist URLs.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/src/lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ParsedChannel {
  name: string;
  streamUrl: string;
  logo: string;
  group: string;
  country: string;
  language: string;
  tvgId: string;
}

function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  const channels: ParsedChannel[] = [];

  let currentMeta: Partial<ParsedChannel> = {};

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      // Parse EXTINF metadata line
      currentMeta = {};

      // tvg-id
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      currentMeta.tvgId = tvgIdMatch?.[1] || "";

      // tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      currentMeta.logo = logoMatch?.[1] || "";

      // tvg-country
      const countryMatch = line.match(/tvg-country="([^"]*)"/);
      currentMeta.country = countryMatch?.[1]?.toUpperCase() || "";

      // tvg-language
      const langMatch = line.match(/tvg-language="([^"]*)"/);
      currentMeta.language = langMatch?.[1] || "";

      // group-title
      const groupMatch = line.match(/group-title="([^"]*)"/);
      currentMeta.group = groupMatch?.[1] || "General";

      // Channel name is after the last comma
      const nameMatch = line.match(/,([^,]+)$/);
      currentMeta.name = nameMatch?.[1]?.trim() || "Unknown Channel";

    } else if (line.startsWith("http://") || line.startsWith("https://") || line.startsWith("rtmp://")) {
      if (currentMeta.name) {
        channels.push({
          name: currentMeta.name || "Unknown",
          streamUrl: line,
          logo: currentMeta.logo || "",
          group: currentMeta.group || "General",
          country: currentMeta.country || "",
          language: currentMeta.language || "",
          tvgId: currentMeta.tvgId || "",
        });
        currentMeta = {};
      }
    }
  }

  return channels;
}

function isBlockedPlaylistHost(hostname: string) {
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

async function requireAdmin() {
  const user = await getCurrentSessionUser();
  return user?.role === "admin";
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const { sourceUrl, countryFilter, groupFilter, limit = 500 } = body;

    if (!sourceUrl) {
      return NextResponse.json({ error: "sourceUrl is required" }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs are supported" }, { status: 400 });
    }

    if (isBlockedPlaylistHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Local or private network playlist URLs are not allowed." }, { status: 400 });
    }

    // Fetch the M3U playlist server-side (avoids CORS issues in browser)
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MyStreamFlix/1.0 IPTV Scanner)",
        "Accept": "application/x-mpegURL, application/vnd.apple.mpegurl, audio/mpegurl, */*",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch playlist: HTTP ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const content = await response.text();

    if (!content.includes("#EXTM3U") && !content.includes("#EXTINF")) {
      return NextResponse.json(
        { error: "Response does not appear to be a valid M3U playlist" },
        { status: 422 }
      );
    }

    // Parse the M3U playlist
    let channels = parseM3U(content);

    // Apply filters
    if (countryFilter && countryFilter !== "ALL") {
      channels = channels.filter(
        ch => ch.country.toUpperCase() === countryFilter.toUpperCase()
      );
    }

    if (groupFilter && groupFilter !== "ALL") {
      channels = channels.filter(
        ch => ch.group.toLowerCase().includes(groupFilter.toLowerCase())
      );
    }

    // Remove duplicate URLs
    const seen = new Set<string>();
    channels = channels.filter(ch => {
      if (seen.has(ch.streamUrl)) return false;
      seen.add(ch.streamUrl);
      return true;
    });

    // Apply limit
    const total = channels.length;
    channels = channels.slice(0, Math.min(limit, 5000));

    // Extract unique groups and countries for filter options
    const allGroups = [...new Set(channels.map(ch => ch.group).filter(Boolean))].sort();
    const allCountries = [...new Set(channels.map(ch => ch.country).filter(Boolean))].sort();

    return NextResponse.json({
      success: true,
      total,
      returned: channels.length,
      channels,
      filters: {
        groups: allGroups,
        countries: allCountries,
      },
    });

  } catch (error: any) {
    console.error("[IPTV-SCAN] Error:", error);

    if (error?.name === "TimeoutError" || error?.code === "ABORT_ERR") {
      return NextResponse.json(
        { error: "Request timed out. The playlist source may be slow or unreachable." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check stream status (HEAD request to verify if URL is online)
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get("url");

  if (!streamUrl) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(streamUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol) || isBlockedPlaylistHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Unsupported or blocked URL." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(streamUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MyStreamFlix/1.0 Stream Checker)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return NextResponse.json({
      online: response.ok || response.status === 200 || response.status === 206,
      status: response.status,
      contentType: response.headers.get("content-type") || null,
    });
  } catch {
    return NextResponse.json({ online: false, status: 0 });
  }
}
