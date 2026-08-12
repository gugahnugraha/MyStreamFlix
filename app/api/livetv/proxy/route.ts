import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    // Determine custom headers based on target domain
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
    };

    if (parsedUrl.hostname.includes("cnnindonesia.com")) {
      headers["Referer"] = "https://www.cnnindonesia.com/";
      headers["Origin"] = "https://www.cnnindonesia.com";
    } else if (parsedUrl.hostname.includes("detik.com")) {
      headers["Referer"] = "https://www.detik.com/";
    } else if (parsedUrl.hostname.includes("indihometv.com")) {
      headers["Referer"] = "https://www.indihometv.com/";
    } else {
      headers["Referer"] = `${parsedUrl.protocol}//${parsedUrl.hostname}/`;
    }

    const forwardHeaders = ["range", "if-none-match"];
    forwardHeaders.forEach(h => {
      const val = request.headers.get(h);
      if (val) headers[h] = val;
    });

    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok && res.status !== 206) {
      return new NextResponse(`Proxy failed to fetch target: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "";
    const isHlsManifest = targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("m3u8");
    const isDashManifest = targetUrl.includes(".mpd") || contentType.includes("dash+xml");

    const baseProxyUrl = `${request.nextUrl.origin}/api/livetv/proxy?url=`;

    if (isHlsManifest) {
      const text = await res.text();
      const parentDir = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      const rewrittenLines = text.split("\n").map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith("#")) {
          // Handle URI in EXT-X-KEY or EXT-X-MAP
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
              const absUrl = new URL(uri, parentDir).href;
              return `URI="${baseProxyUrl}${encodeURIComponent(absUrl)}"`;
            });
          }
          return line;
        }

        // Relative or absolute media segment URL
        const absUrl = new URL(trimmed, parentDir).href;
        return `${baseProxyUrl}${encodeURIComponent(absUrl)}`;
      });

      return new NextResponse(rewrittenLines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    if (isDashManifest) {
      let text = await res.text();
      const parentDir = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      const proxyBaseDir = `${baseProxyUrl}${encodeURIComponent(parentDir)}`;

      // Inject BaseURL if not present so relative segments go through proxy
      if (!text.includes("<BaseURL>") && text.includes("<MPD")) {
        text = text.replace(/(<MPD[^>]*>)/i, `$1\n  <BaseURL>${proxyBaseDir}</BaseURL>`);
      }

      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "application/dash+xml",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Binary segment streaming (TS, MP4, M4S, etc.)
    const bodyBuffer = await res.arrayBuffer();
    const responseHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Content-Type": contentType || "application/octet-stream",
    };

    const passHeaders = ["content-length", "content-range", "accept-ranges"];
    passHeaders.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders[h] = val;
    });

    return new NextResponse(bodyBuffer, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("LiveTV proxy error:", error);
    return NextResponse.json({ error: error.message || "Proxy error" }, { status: 500 });
  }
}
