const PROXY_REQUIRED_DOMAINS = [
  "cnnindonesia.com",
  "live.cnnindonesia.com",
  "cnbcindonesia.com",
  "live.cnbcindonesia.com",
];

export function needsProxy(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (!url.includes(".m3u8")) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const localDomains = ["localhost", "127.0.0.1"];
    if (localDomains.includes(host)) return false;
    return PROXY_REQUIRED_DOMAINS.some(
      (d) => host === d || host.endsWith("." + d)
    );
  } catch {
    return false;
  }
}

export function describeQualityLabel(height: number, bitrate = 0): string {
  const kbps = Math.round(bitrate / 1000);
  if (height >= 2160) return "4K Ultra HD";
  if (height >= 1440) return "1440p QHD";
  if (height >= 1080) return "1080p Full HD";
  if (height >= 720) return "720p HD";
  if (height >= 480) return "480p SD";
  if (height >= 360) return "360p Mobile";
  if (height > 0) return `${height}p`;
  if (kbps > 0) return `${kbps} kbps`;
  return "";
}

export function shortQualityHint(height: number, bitrate = 0): string {
  const kbps = Math.round(bitrate / 1000);
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  if (height >= 360) return "360p";
  if (height > 0) return `${height}p`;
  if (kbps > 0) return `${kbps}kbps`;
  return "";
}

export function getProxiedStreamUrl(url: string): string {
  if (!needsProxy(url)) return url;
  try {
    const base =
      (typeof window !== "undefined" ? window.location.origin : "") +
      "/api/stream-proxy?url=";
    return base + encodeURIComponent(url);
  } catch {
    return url;
  }
}
