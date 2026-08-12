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

  // Known CORS restricted domains or DASH streams that require proxying for smooth playback
  if (
    url.includes("cnnindonesia.com") ||
    url.includes("indihometv.com") ||
    url.includes("detik.com") ||
    url.includes("medcom.id") ||
    url.includes("tvri.go.id") ||
    url.includes(".mpd")
  ) {
    const proxyPath = `/api/livetv/proxy?url=${encodeURIComponent(url)}`;
    return origin ? `${origin}${proxyPath}` : proxyPath;
  }

  return url;
}
