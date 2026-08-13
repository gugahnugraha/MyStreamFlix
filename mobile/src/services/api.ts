import { Movie, LiveChannel } from '../types';

const API_BASE_URL = 'https://mystreamflix.biz.id';

export async function fetchMovies(contentType?: 'movie' | 'series'): Promise<Movie[]> {
  try {
    const url = contentType 
      ? `${API_BASE_URL}/api/movies?contentType=${contentType}`
      : `${API_BASE_URL}/api/movies`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch content');
    return await res.json();
  } catch (error) {
    console.error('API Error fetchMovies:', error);
    return [];
  }
}

export async function fetchLiveChannels(): Promise<LiveChannel[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/livetv/health`);
    if (!res.ok) throw new Error('Failed to fetch Live TV channels');
    const data = await res.json();
    return data.channels || [];
  } catch (error) {
    console.error('API Error fetchLiveChannels:', error);
    return [];
  }
}

export function getStreamProxyUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.includes('.m3u8')) {
    return `${API_BASE_URL}/api/livetv/proxy?url=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
}
