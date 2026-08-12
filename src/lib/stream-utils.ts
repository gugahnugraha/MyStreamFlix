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

export const DEFAULT_PROXY_DOMAINS = [
  "cnnindonesia.com",
  "cnbcindonesia.com",
  "detik.com",
  "medcom.id",
  "tvri.go.id",
  "beetv.my.id",
  "workers.dev",
  "rctiplus.id",
  "dens.tv",
  "cloudfront.net",
  "visionplus.id",
  "indihometv.com",
  "aspaltvpasti.top",
  "maling.pl",
  "sysln.id",
  "siar.us",
  "cloudns.us",
  "tvstreamcast.com",
  "hgmtv.com",
  "akamaihd.net",
  "aiv-cdn.net",
  "bintangstreaming.my.id"
];

const STORAGE_KEY = "mystreamflix_cors_proxy_domains";

export function getCorsProxyDomains(): string[] {
  if (typeof window === "undefined") return DEFAULT_PROXY_DOMAINS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PROXY_DOMAINS;
}

export function saveCorsProxyDomains(domains: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
  } catch {}
}

export function addCorsProxyDomain(domain: string): string[] {
  const clean = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
  if (!clean) return getCorsProxyDomains();
  
  const current = getCorsProxyDomains();
  if (!current.includes(clean)) {
    const updated = [...current, clean];
    saveCorsProxyDomains(updated);
    return updated;
  }
  return current;
}

export function removeCorsProxyDomain(domain: string): string[] {
  const current = getCorsProxyDomains();
  const updated = current.filter(d => d !== domain);
  saveCorsProxyDomains(updated);
  return updated;
}

export function resetCorsProxyDomains(): string[] {
  saveCorsProxyDomains(DEFAULT_PROXY_DOMAINS);
  return DEFAULT_PROXY_DOMAINS;
}

export function getProxiedStreamUrl(url: string): string {
  if (!url) return "";
  
  const getOrigin = () => {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "";
  };

  const origin = getOrigin();

  if (url.startsWith("/api/livetv/proxy")) {
    return origin ? `${origin}${url}` : url;
  }
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const whitelistedDomains = getCorsProxyDomains();
  const shouldProxy = whitelistedDomains.some(domain => url.toLowerCase().includes(domain));

  if (shouldProxy) {
    const proxyPath = `/api/livetv/proxy?url=${encodeURIComponent(url)}`;
    return origin ? `${origin}${proxyPath}` : proxyPath;
  }

  return url;
}
