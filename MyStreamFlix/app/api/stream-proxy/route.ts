import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HeaderProfile = {
  name: string;
  userAgent: string;
  accept: string;
  acceptLang: string;
  acceptEnc: string;
  cacheControl: string;
  pragma: string;
  dnt: string;
  secFetchDest: string;
  secFetchMode: string;
  secFetchSite: string;
  secFetchUser: string;
  upgradeInsecureReq: string;
  secChUa?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
  priority?: string;
  te?: string;
};

const BROWSER_PROFILES: HeaderProfile[] = [
  {
    name: "Chrome 131 Win10 x64",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    accept:
      "application/vnd.apple.mpegurl, application/x-mpegURL, video/x-mpegURL, */*;q=0.8",
    acceptLang: "en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7",
    acceptEnc: "gzip, deflate, br, zstd",
    cacheControl: "no-cache",
    pragma: "no-cache",
    dnt: "1",
    secFetchDest: "empty",
    secFetchMode: "cors",
    secFetchSite: "cross-site",
    secFetchUser: "?1",
    upgradeInsecureReq: "1",
    secChUa:
      '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Windows"',
    priority: "u=4",
    te: "trailers",
  },
  {
    name: "Chrome 130 Android Mobile",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    accept: "*/*",
    acceptLang: "id,en-US;q=0.9,en;q=0.8",
    acceptEnc: "gzip, deflate, br, zstd",
    cacheControl: "max-age=0",
    pragma: "no-cache",
    dnt: "0",
    secFetchDest: "video",
    secFetchMode: "no-cors",
    secFetchSite: "same-site",
    secFetchUser: "?1",
    upgradeInsecureReq: "1",
    secChUa:
      '"Google Chrome";v="130", "Chromium";v="130", "Not_A Brand";v="99"',
    secChUaMobile: "?1",
    secChUaPlatform: '"Android"',
  },
  {
    name: "Safari 17 macOS",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    accept: "*/*",
    acceptLang: "en-US,en;q=0.9",
    acceptEnc: "gzip, deflate, br",
    cacheControl: "max-age=0",
    pragma: "",
    dnt: "",
    secFetchDest: "video",
    secFetchMode: "no-cors",
    secFetchSite: "cross-site",
    secFetchUser: "?1",
    upgradeInsecureReq: "",
  },
  {
    name: "HLS.js Chrome Generic",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 hls.js/1.6.17",
    accept: "*/*",
    acceptLang: "*",
    acceptEnc: "gzip, deflate, br",
    cacheControl: "no-cache",
    pragma: "no-cache",
    dnt: "0",
    secFetchDest: "empty",
    secFetchMode: "cors",
    secFetchSite: "same-site",
    secFetchUser: "?1",
    upgradeInsecureReq: "",
  },
];

function buildHeaders(
  profile: HeaderProfile,
  targetUrlObj: URL,
  originalHeaders: Headers,
  useXForwarded: boolean
): Headers {
  const h = new Headers();

  h.set("User-Agent", profile.userAgent);
  h.set("Accept", profile.accept);
  h.set("Accept-Language", profile.acceptLang);
  h.set("Accept-Encoding", profile.acceptEnc);
  if (profile.cacheControl) h.set("Cache-Control", profile.cacheControl);
  if (profile.pragma) h.set("Pragma", profile.pragma);
  if (profile.dnt) h.set("DNT", profile.dnt);
  if (profile.upgradeInsecureReq)
    h.set("Upgrade-Insecure-Requests", profile.upgradeInsecureReq);
  if (profile.secChUa) h.set("sec-ch-ua", profile.secChUa);
  if (profile.secChUaMobile) h.set("sec-ch-ua-mobile", profile.secChUaMobile);
  if (profile.secChUaPlatform)
    h.set("sec-ch-ua-platform", profile.secChUaPlatform);
  h.set("Sec-Fetch-Dest", profile.secFetchDest);
  h.set("Sec-Fetch-Mode", profile.secFetchMode);
  h.set("Sec-Fetch-Site", profile.secFetchSite);
  h.set("Sec-Fetch-User", profile.secFetchUser);
  if (profile.priority) h.set("Priority", profile.priority);
  if (profile.te) h.set("TE", profile.te);

  h.set("Referer", "https://www.cnnindonesia.com/");
  h.set("Origin", "https://www.cnnindonesia.com");
  h.set("Host", targetUrlObj.hostname);

  const range = originalHeaders.get("range");
  if (range) h.set("Range", range);

  const ifNoneMatch = originalHeaders.get("if-none-match");
  if (ifNoneMatch) h.set("If-None-Match", ifNoneMatch);
  const ifModified = originalHeaders.get("if-modified-since");
  if (ifModified) h.set("If-Modified-Since", ifModified);

  if (useXForwarded) {
    const oct1 = Math.floor(Math.random() * 223) + 1;
    const oct2 = Math.floor(Math.random() * 256);
    const oct3 = Math.floor(Math.random() * 256);
    const oct4 = Math.floor(Math.random() * 256);
    const fakeIp = `${oct1}.${oct2}.${oct3}.${oct4}`;
    h.set("X-Forwarded-For", fakeIp);
    h.set("X-Real-IP", fakeIp);
    h.set("X-Forwarded-Proto", "https");
    h.set("X-Forwarded-Host", targetUrlObj.hostname);
    h.set("Forwarded", `for=${fakeIp};proto=https;host=${targetUrlObj.hostname}`);
    h.set("True-Client-IP", fakeIp);
  }

  return h;
}

async function fetchOnce(
  decodedUrl: string,
  targetUrlObj: URL,
  originalHeaders: Headers,
  profileIndex: number,
  useXForwarded: boolean
): Promise<{ res: Response; profileName: string }> {
  const profile = BROWSER_PROFILES[profileIndex % BROWSER_PROFILES.length];
  const reqHeaders = buildHeaders(
    profile,
    targetUrlObj,
    originalHeaders,
    useXForwarded
  );
  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(decodedUrl, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    return { res, profileName: profile.name };
  } finally {
    clearTimeout(timeout);
  }
}

function buildResponseHeaders(upstream: Response): Headers {
  const h = new Headers();
  const setIf = (key: string, val: string | null | undefined) => {
    if (val) h.set(key, val);
  };
  setIf("content-type", upstream.headers.get("content-type"));
  setIf("content-length", upstream.headers.get("content-length"));
  setIf("content-range", upstream.headers.get("content-range"));
  setIf("accept-ranges", upstream.headers.get("accept-ranges"));
  setIf("last-modified", upstream.headers.get("last-modified"));
  setIf("etag", upstream.headers.get("etag"));
  const cc = upstream.headers.get("cache-control");
  if (cc) h.set("cache-control", cc);
  else h.set("cache-control", "no-store, no-cache, must-revalidate");
  const enc = upstream.headers.get("content-encoding");
  if (enc) h.set("content-encoding", enc);
  const vary = upstream.headers.get("vary");
  if (vary) h.set("vary", vary);

  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Range, User-Agent, Referer, Origin, Cache-Control, If-None-Match, If-Modified-Since"
  );
  h.set(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, ETag, Last-Modified"
  );
  return h;
}

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

  let targetUrlObj: URL;
  try {
    targetUrlObj = new URL(decodedUrl);
  } catch {
    return NextResponse.json(
      { error: "Invalid target URL" },
      { status: 400 }
    );
  }

  const originalHeaders = new Headers(request.headers);

  const attempts: { profile: string; status: number; error?: string }[] = [];
  let finalResponse: Response | null = null;
  let finalProfileName = "";

  const strategies: { profileIdx: number; xForwarded: boolean }[] = [
    { profileIdx: 0, xForwarded: true },
    { profileIdx: 1, xForwarded: true },
    { profileIdx: 2, xForwarded: true },
    { profileIdx: 0, xForwarded: false },
    { profileIdx: 3, xForwarded: false },
    { profileIdx: 1, xForwarded: false },
  ];

  for (const strat of strategies) {
    try {
      const { res, profileName } = await fetchOnce(
        decodedUrl,
        targetUrlObj,
        originalHeaders,
        strat.profileIdx,
        strat.xForwarded
      );
      attempts.push({ profile: profileName, status: res.status });
      if (
        res.ok ||
        res.status === 304 ||
        (res.status >= 200 && res.status < 300) ||
        res.status === 206
      ) {
        finalResponse = res;
        finalProfileName = profileName;
        break;
      }
      if (res.status === 403 && !finalResponse) {
        finalResponse = res.clone();
        finalProfileName = profileName;
      } else if (!finalResponse) {
        finalResponse = res.clone();
        finalProfileName = profileName;
      }
    } catch (e: any) {
      attempts.push({
        profile: BROWSER_PROFILES[strat.profileIdx % BROWSER_PROFILES.length]
          .name,
        status: 0,
        error: e?.message || "fetch exception",
      });
    }
  }

  if (!finalResponse) {
    return NextResponse.json(
      {
        error: "All upstream attempts failed",
        attempts,
      },
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

  try {
    const responseHeaders = buildResponseHeaders(finalResponse);
    responseHeaders.set(
      "X-Proxy-Debug-Profile",
      finalProfileName + (attempts.length > 1 ? ` (retries=${attempts.length})` : "")
    );

    const contentType = responseHeaders.get("content-type") || "";
    const isPlaylist =
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("application/x-mpegURL") ||
      contentType.includes("text/") ||
      decodedUrl.endsWith(".m3u8");

    let body: BodyInit | null = null;

    if (isPlaylist && finalResponse.body) {
      let textContent = await finalResponse.text();
      const baseUrlStr = decodedUrl.substring(0, decodedUrl.lastIndexOf("/") + 1);
      const baseUrl = new URL(baseUrlStr);
      const siteOrigin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof request.nextUrl !== "undefined"
          ? `${request.nextUrl.protocol}//${request.nextUrl.host}`
          : "");
      const proxyBase = `${siteOrigin}/api/stream-proxy?url=`;

      const rewriteLine = (match: string, chunkPath: string): string => {
        if (
          chunkPath.startsWith("http://") ||
          chunkPath.startsWith("https://") ||
          chunkPath.startsWith("//")
        ) {
          const abs = chunkPath.startsWith("//")
            ? baseUrl.protocol + chunkPath
            : chunkPath;
          return match.replace(chunkPath, proxyBase + encodeURIComponent(abs));
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

      textContent = textContent.replace(/^(?!#)(?!\s*$)([^\s]+)$/gm, rewriteLine);
      textContent = textContent.replace(/(?:URI=)"([^"]+)"/g, (match, uri) => {
        try {
          const resolved = uri.startsWith("http")
            ? uri
            : new URL(uri, baseUrl).toString();
          return `URI="${proxyBase}${encodeURIComponent(resolved)}"`;
        } catch {
          return match;
        }
      });

      body = textContent;
      if (!responseHeaders.has("content-type")) {
        responseHeaders.set("content-type", "application/vnd.apple.mpegurl");
      }
    } else if (finalResponse.body) {
      body = finalResponse.body;
    }

    return new NextResponse(body, {
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      headers: responseHeaders,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Proxy build response failed",
        details: e?.message || String(e),
        upstreamStatus: finalResponse.status,
        attempts,
      },
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
        "Content-Type, Accept, Range, User-Agent, Referer, Origin, Cache-Control, If-None-Match, If-Modified-Since",
      "Access-Control-Max-Age": "86400",
    },
  });
}
