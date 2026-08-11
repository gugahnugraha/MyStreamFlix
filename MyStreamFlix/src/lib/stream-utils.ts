export function needsProxy(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (!url.includes(".m3u8")) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const localDomains = ["localhost", "127.0.0.1"];
    if (localDomains.includes(host)) return false;
    return true;
  } catch {
    return false;
  }
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
