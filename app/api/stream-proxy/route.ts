import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(targetUrl);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL encoding" },
      { status: 400 }
    );
  }

  try {
    const targetUrlObj = new URL(decodedUrl);
    const originalHeaders = new Headers(request.headers);

    const forwardHeaders = new Headers();
    const forwardableHeaders = [
      "accept",
      "accept-language",
      "accept-encoding",
      "range",
      "user-agent",
      "referer",
      "origin",
      "cache-control",
      "pragma",
      "if-modified-since",
      "if-none-match",
    ];

    for (const key of forwardableHeaders) {
      const val = originalHeaders.get(key);
      if (val) {
        forwardHeaders.set(key, val);
      }
    }

    if (!forwardHeaders.has("user-agent")) {
      forwardHeaders.set(
        "user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
    }

    if (!forwardHeaders.has("referer")) {
      forwardHeaders.set("referer", targetUrlObj.origin + "/");
    }

    if (!forwardHeaders.has("origin")) {
      forwardHeaders.set("origin", targetUrlObj.origin);
    }

    const upstreamResponse = await fetch(decodedUrl, {
      method: "GET",
      headers: forwardHeaders,
      cache: "no-store",
    });

    const responseHeaders = new Headers();

    const contentType = upstreamResponse.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("content-type", contentType);
    }

    const contentLength = upstreamResponse.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("content-length", contentLength);
    }

    const contentRange = upstreamResponse.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("content-range", contentRange);
    }

    const acceptRanges = upstreamResponse.headers.get("accept-ranges");
    if (acceptRanges) {
      responseHeaders.set("accept-ranges", acceptRanges);
    }

    const cacheControl = upstreamResponse.headers.get("cache-control");
    if (cacheControl) {
      responseHeaders.set("cache-control", cacheControl);
    } else {
      responseHeaders.set("cache-control", "no-store, no-cache, must-revalidate");
    }

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, Range, User-Agent, Referer, Origin, Cache-Control"
    );
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");

    let body: BodyInit | null = null;
    const isTextType =
      contentType?.includes("application/vnd.apple.mpegurl") ||
      contentType?.includes("application/x-mpegURL") ||
      contentType?.includes("text/") ||
      decodedUrl.endsWith(".m3u8");

    if (isTextType && upstreamResponse.body) {
      let textContent = await upstreamResponse.text();

      const baseUrlStr = decodedUrl.substring(0, decodedUrl.lastIndexOf("/") + 1);
      const baseUrl = new URL(baseUrlStr);

      const proxyBase =
        (process.env.NEXT_PUBLIC_SITE_URL || "") + "/api/stream-proxy?url=";

      const rewriteChunk = (match: string, chunkPath: string): string => {
        if (
          chunkPath.startsWith("http://") ||
          chunkPath.startsWith("https://") ||
          chunkPath.startsWith("//")
        ) {
          const absUrl = chunkPath.startsWith("//")
            ? baseUrl.protocol + chunkPath
            : chunkPath;
          return match.replace(
            chunkPath,
            proxyBase + encodeURIComponent(absUrl)
          );
        }

        try {
          const resolved = new URL(chunkPath, baseUrl).toString();
          return match.replace(
            chunkPath,
            proxyBase + encodeURIComponent(resolved)
          );
        } catch {
          return match;
        }
      };

      textContent = textContent.replace(
        /^(?!#)(?!\s*$)([^\s]+)$/gm,
        rewriteChunk
      );

      textContent = textContent.replace(
        /(?:URI=)"([^"]+)"/g,
        (match, uri) => {
          if (uri.startsWith("http://") || uri.startsWith("https://")) {
            return `URI="${proxyBase}${encodeURIComponent(uri)}"`;
          }
          try {
            const resolved = new URL(uri, baseUrl).toString();
            return `URI="${proxyBase}${encodeURIComponent(resolved)}"`;
          } catch {
            return match;
          }
        }
      );

      body = textContent;
      if (!responseHeaders.has("content-type")) {
        responseHeaders.set("content-type", "application/vnd.apple.mpegurl");
      }
    } else if (upstreamResponse.body) {
      body = upstreamResponse.body;
    }

    return new NextResponse(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[stream-proxy] Upstream fetch error:", error);
    return NextResponse.json(
      { error: "Upstream request failed", details: error?.message || String(error) },
      {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, Range, User-Agent, Referer, Origin, Cache-Control",
      "Access-Control-Max-Age": "86400",
    },
  });
}
