import { CapacitorVideoPlayer } from 'capacitor-video-player';
import { isNativeCapacitor } from './native-fullscreen';

export interface PlayExoOptions {
  url: string;
  title?: string;
  isLive?: boolean;
}

export async function playWithNativeExoPlayer(options: PlayExoOptions): Promise<boolean> {
  if (!isNativeCapacitor()) {
    return false;
  }

  // Ensure target URL is an absolute URL for native Android ExoPlayer
  let targetUrl = options.url;
  if (targetUrl.startsWith('/')) {
    const baseOrigin = typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : 'https://mystreamflix.biz.id';
    targetUrl = `${baseOrigin}${targetUrl}`;
  }

  try {
    const result = await CapacitorVideoPlayer.initPlayer({
      mode: 'fullscreen',
      url: targetUrl,
      title: options.title || 'MyStreamFlix',
      playerId: 'exoplayer-container',
      componentTag: 'div',
      exitOnEnd: true,
      loopOnEnd: false,
      pipEnabled: true,
    });

    return !!result?.result;
  } catch (error) {
    console.warn('Native ExoPlayer launch warning:', error);
    return false;
  }
}
