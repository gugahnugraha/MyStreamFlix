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
  return url || "";
}
