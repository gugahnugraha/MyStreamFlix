import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  PanResponder,
  Platform,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import Slider from "@react-native-community/slider";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Subtitles,
  Settings,
  Lock,
  Unlock,
  Check,
  Sun,
  Scaling,
  Tv,
  ChevronLeft,
} from "lucide-react-native";
import { Movie, Season, Episode } from "../types";

interface NativeExoPlayerProps {
  movie: Movie;
  initialProgress?: number;
  onClose: () => void;
  brandColor?: string;
  backendUrl?: string;
}

export default function NativeExoPlayer({
  movie,
  initialProgress = 0,
  onClose,
  brandColor = "#00ADB5",
  backendUrl = "https://mystreamflix.biz.id",
}: NativeExoPlayerProps) {
  const videoRef = useRef<Video>(null);

  // Active season & episode for series
  const [activeSeason, setActiveSeason] = useState<Season | null>(() => {
    return movie.contentType === "series" && movie.seasons && movie.seasons.length > 0
      ? movie.seasons[0]
      : null;
  });

  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(() => {
    return movie.contentType === "series" && movie.seasons && movie.seasons.length > 0
      ? movie.seasons[0].episodes[0] || null
      : null;
  });

  // Playback states
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(movie.duration * 60 || 600);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  // Aspect ratio: "contain" | "cover" | "stretch"
  const [aspectRatio, setAspectRatio] = useState<"contain" | "cover" | "stretch">("contain");
  const [brightness, setBrightness] = useState(1.0);

  // Gestures & Toast Feedback
  const [gestureToast, setGestureToast] = useState<{
    type: "volume" | "brightness" | "seek-forward" | "seek-backward";
    value: string;
    percent?: number;
  } | null>(null);

  // Subtitles & Audio modal
  const [activeSubtitle, setActiveSubtitle] = useState<string>("off");
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);

  const controlsTimerRef = useRef<any>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  // Lock to Landscape upon entering player in Expo
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    StatusBar.setHidden(true, "fade");

    return () => {
      ScreenOrientation.unlockAsync();
      StatusBar.setHidden(false, "fade");
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // Controls auto-hide timer (4 seconds)
  const resetControlsTimer = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !isScreenLocked) {
        setShowControls(false);
      }
    }, 4000);
  };

  const showToast = (toast: { type: "volume" | "brightness" | "seek-forward" | "seek-backward"; value: string; percent?: number }) => {
    setGestureToast(toast);
    setTimeout(() => {
      setGestureToast(null);
    }, 1000);
  };

  // PanResponder for vertical swipe (Brightness on left, Volume on right)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 15,
      onPanResponderMove: (evt, gestureState) => {
        if (isScreenLocked) return;
        const screenWidth = Dimensions.get("window").width;
        const touchX = evt.nativeEvent.pageX;

        // Left 45% = Brightness
        if (touchX < screenWidth * 0.45) {
          const delta = -gestureState.dy / 200;
          const newBright = Math.min(1.0, Math.max(0.15, brightness + delta));
          setBrightness(newBright);
          showToast({
            type: "brightness",
            value: `${Math.round(newBright * 100)}%`,
            percent: Math.round(newBright * 100),
          });
        }
        // Right 45% = Volume
        else if (touchX > screenWidth * 0.55) {
          const delta = -gestureState.dy / 200;
          const newVol = Math.min(1.0, Math.max(0.0, volume + delta));
          setVolume(newVol);
          setIsMuted(newVol === 0);
          videoRef.current?.setStatusAsync({ volume: newVol, isMuted: newVol === 0 });
          showToast({
            type: "volume",
            value: `${Math.round(newVol * 100)}%`,
            percent: Math.round(newVol * 100),
          });
        }
      },
    })
  ).current;

  // Double Tap Seek & Single Tap Controls Toggle
  const handleScreenPress = (evt: any) => {
    if (isScreenLocked) return;
    const now = Date.now();
    const screenWidth = Dimensions.get("window").width;
    const touchX = evt.nativeEvent.pageX;

    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      // Double tap detected!
      if (touchX > screenWidth / 2) {
        // Forward +10s
        handleSeek(currentTime + 10);
        showToast({ type: "seek-forward", value: "+10s" });
      } else {
        // Rewind -10s
        handleSeek(Math.max(0, currentTime - 10));
        showToast({ type: "seek-backward", value: "-10s" });
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: touchX };
      // Single tap toggles HUD
      if (showControls) {
        setShowControls(false);
      } else {
        resetControlsTimer();
      }
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  const handleSeek = async (timeInSeconds: number) => {
    const target = Math.max(0, Math.min(duration, timeInSeconds));
    setCurrentTime(target);
    await videoRef.current?.setPositionAsync(target * 1000);
    resetControlsTimer();
  };

  const cycleAspectRatio = () => {
    setAspectRatio((prev) => {
      if (prev === "contain") return "cover";
      if (prev === "cover") return "stretch";
      return "contain";
    });
    resetControlsTimer();
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsBuffering(true);
      return;
    }

    setIsBuffering(status.isBuffering);
    setIsPlaying(status.isPlaying);
    setCurrentTime(status.positionMillis / 1000);
    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Resolve target streaming URL (with Google Drive backend proxy fallback)
  let targetUrl = activeEpisode ? activeEpisode.videoUrl : movie.videoUrl;
  if (targetUrl.includes("drive.google.com")) {
    const match = targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      targetUrl = `${backendUrl}/api/gdrive/stream?id=${match[1]}`;
    }
  }

  const resizeModeProp =
    aspectRatio === "cover"
      ? ResizeMode.COVER
      : aspectRatio === "stretch"
      ? ResizeMode.STRETCH
      : ResizeMode.CONTAIN;

  return (
    <View style={styles.container}>
      {/* ExoPlayer Core via Expo AV */}
      <Video
        ref={videoRef}
        source={{ uri: targetUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeModeProp}
        shouldPlay={isPlaying}
        isMuted={isMuted}
        volume={volume}
        rate={playbackRate}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        usePoster={true}
        posterSource={{ uri: movie.backdropUrl || movie.posterUrl }}
      />

      {/* Screen Brightness Overlay Filter */}
      <View
        pointerEvents="none"
        style={[styles.brightnessOverlay, { opacity: Math.max(0, 1 - brightness) }]}
      />

      {/* Gesture Pan Responder Surface */}
      <TouchableWithoutFeedback onPress={handleScreenPress}>
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
      </TouchableWithoutFeedback>

      {/* Buffering Spinner */}
      {isBuffering && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.bufferingText}>Buffering ExoPlayer...</Text>
        </View>
      )}

      {/* Gesture Toast (Volume / Brightness / Seek Feedback) */}
      {gestureToast && (
        <View style={styles.toastContainer} pointerEvents="none">
          {gestureToast.type === "volume" && <Volume2 size={28} color="#00ADB5" />}
          {gestureToast.type === "brightness" && <Sun size={28} color="#FBBF24" />}
          {gestureToast.type === "seek-forward" && <RotateCw size={28} color="#10B981" />}
          {gestureToast.type === "seek-backward" && <RotateCcw size={28} color="#10B981" />}
          <Text style={styles.toastText}>{gestureToast.value}</Text>
        </View>
      )}

      {/* Touch Lock Floating Unlock Button */}
      {isScreenLocked && (
        <TouchableOpacity
          style={styles.floatingUnlockBtn}
          onPress={() => setIsScreenLocked(false)}
        >
          <Lock size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* HUD Controls Layer */}
      {showControls && !isScreenLocked && (
        <View style={styles.hudOverlay} pointerEvents="box-none">
          {/* Top Bar Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <ChevronLeft size={26} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.movieTitle} numberOfLines={1}>
                {movie.title}{" "}
                {activeEpisode ? `• S${activeSeason?.seasonNumber}E${activeEpisode.episodeNumber}: ${activeEpisode.title}` : ""}
              </Text>
            </View>

            <View style={styles.topActions}>
              {/* Aspect Ratio Switcher */}
              <TouchableOpacity onPress={cycleAspectRatio} style={styles.pillBtn}>
                <Scaling size={16} color="#00ADB5" />
                <Text style={styles.pillBtnText}>{aspectRatio.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Series Episodes Drawer Toggle */}
              {movie.contentType === "series" && (
                <TouchableOpacity onPress={() => setShowEpisodeDrawer(true)} style={styles.pillBtn}>
                  <Tv size={16} color="#E50914" />
                  <Text style={styles.pillBtnText}>EPISODES</Text>
                </TouchableOpacity>
              )}

              {/* Lock Screen */}
              <TouchableOpacity onPress={() => setIsScreenLocked(true)} style={styles.iconBtn}>
                <Unlock size={20} color="#CCC" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Playback Controller */}
          <View style={styles.centerControls} pointerEvents="box-none">
            <TouchableOpacity onPress={() => handleSeek(currentTime - 10)} style={styles.roundBtn}>
              <RotateCcw size={26} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
              {isPlaying ? <Pause size={36} color="#FFF" /> : <Play size={36} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSeek(currentTime + 10)} style={styles.roundBtn}>
              <RotateCw size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Control Bar */}
          <View style={styles.bottomBar}>
            {/* Timeline Progress Slider */}
            <View style={styles.progressRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration || 1}
                value={currentTime}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor={brandColor}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor={brandColor}
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.bottomActionsRow}>
              {/* Volume Toggle */}
              <TouchableOpacity
                onPress={() => {
                  const targetMute = !isMuted;
                  setIsMuted(targetMute);
                  videoRef.current?.setStatusAsync({ isMuted: targetMute });
                }}
                style={styles.iconBtn}
              >
                {isMuted ? <VolumeX size={20} color="#E50914" /> : <Volume2 size={20} color="#FFF" />}
              </TouchableOpacity>

              <View style={styles.bottomRightActions}>
                {/* Speed Selector */}
                <TouchableOpacity onPress={() => setShowSpeedModal(true)} style={styles.menuBtn}>
                  <Settings size={16} color="#FFF" />
                  <Text style={styles.menuBtnText}>{playbackRate}x</Text>
                </TouchableOpacity>

                {/* Subtitles Selector */}
                {movie.subtitles && movie.subtitles.length > 0 && (
                  <TouchableOpacity onPress={() => setShowSubtitleModal(true)} style={styles.menuBtn}>
                    <Subtitles size={16} color={activeSubtitle !== "off" ? "#E50914" : "#FFF"} />
                    <Text style={styles.menuBtnText}>SUB</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Speed Selector Modal */}
      <Modal visible={showSpeedModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSpeedModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.bottomSheet}>
              <Text style={styles.modalTitle}>Playback Speed</Text>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  onPress={async () => {
                    setPlaybackRate(rate);
                    await videoRef.current?.setStatusAsync({ rate });
                    setShowSpeedModal(false);
                  }}
                  style={[styles.modalItem, playbackRate === rate && styles.modalItemActive]}
                >
                  <Text style={[styles.modalItemText, playbackRate === rate && { color: brandColor }]}>
                    {rate}x {rate === 1.0 ? "(Normal)" : ""}
                  </Text>
                  {playbackRate === rate && <Check size={18} color={brandColor} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Subtitles Modal */}
      <Modal visible={showSubtitleModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSubtitleModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.bottomSheet}>
              <Text style={styles.modalTitle}>Subtitles & Captions</Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveSubtitle("off");
                  setShowSubtitleModal(false);
                }}
                style={[styles.modalItem, activeSubtitle === "off" && styles.modalItemActive]}
              >
                <Text style={styles.modalItemText}>Off (None)</Text>
                {activeSubtitle === "off" && <Check size={18} color={brandColor} />}
              </TouchableOpacity>
              {movie.subtitles?.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => {
                    setActiveSubtitle(sub.language);
                    setShowSubtitleModal(false);
                  }}
                  style={[styles.modalItem, activeSubtitle === sub.language && styles.modalItemActive]}
                >
                  <Text style={styles.modalItemText}>{sub.label}</Text>
                  {activeSubtitle === sub.language && <Check size={18} color={brandColor} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Episodes Drawer Modal (TV Series) */}
      <Modal visible={showEpisodeDrawer} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowEpisodeDrawer(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.episodesDrawer}>
              <Text style={styles.modalTitle}>Seasons & Episodes</Text>
              <ScrollView style={{ maxHeight: 280 }}>
                {activeSeason?.episodes.map((ep) => {
                  const isCurrent = activeEpisode?.id === ep.id;
                  return (
                    <TouchableOpacity
                      key={ep.id}
                      onPress={() => {
                        setActiveEpisode(ep);
                        setCurrentTime(0);
                        setShowEpisodeDrawer(false);
                      }}
                      style={[styles.episodeItem, isCurrent && styles.episodeItemActive]}
                    >
                      <Text style={styles.episodeNumber}>EP {ep.episodeNumber}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.episodeTitle, isCurrent && { color: "#E50914" }]}>
                          {ep.title}
                        </Text>
                        {ep.description ? (
                          <Text style={styles.episodeDesc} numberOfLines={2}>
                            {ep.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  brightnessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bufferingText: {
    color: "#FFF",
    marginTop: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  toastContainer: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: "rgba(10,10,10,0.85)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    gap: 6,
  },
  toastText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
  },
  floatingUnlockBtn: {
    position: "absolute",
    left: 20,
    top: 20,
    backgroundColor: "rgba(229,9,20,0.9)",
    padding: 14,
    borderRadius: 30,
    elevation: 8,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  movieTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 36,
  },
  roundBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 14,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  playPauseBtn: {
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  bottomBar: {
    gap: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeText: {
    color: "#CCC",
    fontSize: 11,
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    fontWeight: "bold",
  },
  slider: {
    flex: 1,
    height: 30,
  },
  bottomActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  menuBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#121214",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#27272A",
  },
  episodesDrawer: {
    backgroundColor: "#121214",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: 360,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 14,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#1E1E22",
  },
  modalItemActive: {
    backgroundColor: "rgba(0,173,181,0.08)",
  },
  modalItemText: {
    color: "#EEE",
    fontSize: 13,
    fontWeight: "600",
  },
  episodeItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#1E1E22",
  },
  episodeItemActive: {
    backgroundColor: "rgba(229,9,20,0.1)",
  },
  episodeNumber: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
  },
  episodeTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  episodeDesc: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },
});
