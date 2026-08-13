import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  Maximize,
  Minimize,
  Radio,
  Tv,
} from 'lucide-react-native';

// Safely require react-native-video to prevent crashes in Expo Go sandbox
let NativeVideo: any = null;
try {
  NativeVideo = require('react-native-video').default;
} catch (e) {
  console.log('react-native-video native module not available in Expo Go sandbox');
}

interface ExoVideoPlayerProps {
  videoUrl: string;
  title: string;
  isLive?: boolean;
  onBack: () => void;
}

export const ExoVideoPlayer: React.FC<ExoVideoPlayerProps> = ({
  videoUrl,
  title,
  isLive = false,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<any>(null);

  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgress = (data: { currentTime: number }) => {
    setCurrentTime(data.currentTime);
  };

  const handleLoad = (data: { duration: number }) => {
    setDuration(data.duration);
    setLoading(false);
  };

  const handleRewind = () => {
    if (videoRef.current) {
      const newPos = Math.max(0, currentTime - 10);
      videoRef.current.seek(newPos);
    }
  };

  const handleForward = () => {
    if (videoRef.current) {
      const newPos = Math.min(duration, currentTime + 10);
      videoRef.current.seek(newPos);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.touchArea}
        onPress={() => setShowControls(!showControls)}
      >
        {NativeVideo ? (
          <NativeVideo
            ref={videoRef}
            source={{
              uri: videoUrl,
              type: videoUrl.includes('.m3u8') ? 'm3u8' : videoUrl.includes('.mpd') ? 'mpd' : undefined,
            }}
            style={styles.video}
            resizeMode="contain"
            paused={paused}
            onLoadStart={() => setLoading(true)}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={() => setPaused(true)}
            onError={(err: any) => {
              console.error('ExoPlayer Error:', err);
              setLoading(false);
            }}
            useTextureView={Platform.OS === 'android'}
            playInBackground={false}
            playWhenInactive={false}
          />
        ) : (
          <View style={styles.fallbackPlayer}>
            <Tv color="#E50914" size={48} style={{ marginBottom: 12 }} />
            <Text style={styles.fallbackTitle}>ExoPlayer Native Engine</Text>
            <Text style={styles.fallbackText}>
              Pemutar video native ExoPlayer aktif saat dijalankan via APK Standalone atau Development Build.
            </Text>
            <Text style={styles.streamUrlText} numberOfLines={1}>
              Stream: {videoUrl}
            </Text>
          </View>
        )}

        {loading && NativeVideo && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Memuat ExoPlayer...</Text>
          </View>
        )}

        {showControls && (
          <View style={[styles.controlsOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Top Control Bar with Safe Area Padding */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <ArrowLeft color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {title}
              </Text>
              {isLive && (
                <View style={styles.liveBadge}>
                  <Radio color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>

            {/* Center Playback Action Controls */}
            <View style={styles.centerControls}>
              {!isLive && (
                <TouchableOpacity onPress={handleRewind} style={styles.controlBtn}>
                  <RotateCcw color="#FFFFFF" size={32} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setPaused(!paused)}
                style={[styles.controlBtn, styles.mainPlayBtn]}
              >
                {paused ? (
                  <Play color="#FFFFFF" size={36} style={{ marginLeft: 4 }} />
                ) : (
                  <Pause color="#FFFFFF" size={36} />
                )}
              </TouchableOpacity>

              {!isLive && (
                <TouchableOpacity onPress={handleForward} style={styles.controlBtn}>
                  <RotateCw color="#FFFFFF" size={32} />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom HUD Bar with Safe Area Inset */}
            {!isLive && (
              <View style={styles.bottomBar}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` },
                    ]}
                  />
                </View>

                <Text style={styles.timeText}>{formatTime(duration)}</Text>

                <TouchableOpacity
                  onPress={() => setIsFullscreen(!isFullscreen)}
                  style={styles.iconButton}
                >
                  {isFullscreen ? (
                    <Minimize color="#FFFFFF" size={20} />
                  ) : (
                    <Maximize color="#FFFFFF" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fallbackPlayer: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  fallbackText: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  streamUrlText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '600',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E5E5E5',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  videoTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mainPlayBtn: {
    padding: 16,
    backgroundColor: '#E50914',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    color: '#E5E5E5',
    fontSize: 12,
    marginHorizontal: 8,
    fontWeight: '500',
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E50914',
  },
});
