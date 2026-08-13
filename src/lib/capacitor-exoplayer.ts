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

  try {
    const result = await CapacitorVideoPlayer.initPlayer({
      mode: 'fullscreen',
      url: options.url,
      title: options.title || 'MyStreamFlix',
      playerId: 'exoplayer-container',
      componentTag: 'div',
      exitOnEnd: true,
      loopOnEnd: false,
      pipEnabled: true,
      bkForwardButtonEnabled: true,
    });

    return !!result?.result;
  } catch (error) {
    console.warn('Native ExoPlayer launch warning:', error);
    return false;
  }
}
