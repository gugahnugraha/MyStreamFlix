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
  Platform,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import Slider from "@react-native-community/slider";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
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
  Maximize,
  Minimize,
  ChevronLeft,
  Tv,
  Check,
  Radio,
} from "lucide-react-native";
import { Movie, Episode, Subtitle } from "../types";
import { useLanguage } from "../context/LanguageContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MediaPlayerProps {
  movie: Movie;
  onClose: () => void;
}

export default function MediaPlayer({ movie, onClose }: MediaPlayerProps) {
  const { t } = useLanguage();
  const videoRef = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(ResizeMode.CONTAIN);

  // Modals inside player
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);

  // Active video URL (could be episode URL)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const activeVideoUrl = currentEpisode?.videoUrl || movie.videoUrl;

  const hideControlsTimer = useRef<any>(null);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      // Restore orientation on exit
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible").catch(() => {});
      }
    };
  }, []);

  // 🌟 Toggle Fullscreen & Force Landscape Rotation
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("hidden").catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible").catch(() => {});
      }
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) console.warn("Player error:", status.error);
      return;
    }
    setIsPlaying(status.isPlaying);
    setIsBuffering(status.isBuffering);
    setPositionMillis(status.positionMillis);
    if (status.durationMillis) setDurationMillis(status.durationMillis);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    resetControlsTimer();
  };

  const seekForward = async () => {
    if (!videoRef.current) return;
    const target = Math.min(positionMillis + 10000, durationMillis);
    await videoRef.current.setPositionAsync(target);
    resetControlsTimer();
  };

  const seekBackward = async () => {
    if (!videoRef.current) return;
    const target = Math.max(positionMillis - 10000, 0);
    await videoRef.current.setPositionAsync(target);
    resetControlsTimer();
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const hasSeasons = movie.seasons && movie.seasons.length > 0 && movie.seasons[0].episodes?.length > 0;

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} barStyle="light-content" backgroundColor="#000" />

      {/* Video Viewport */}
      <View style={styles.videoWrap}>
        <Video
          ref={videoRef}
          source={{ uri: activeVideoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          shouldPlay
          isMuted={isMuted}
          rate={playbackRate}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Tap area to reveal controls */}
        <TouchableWithoutFeedback onPress={resetControlsTimer}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Buffering Spinner */}
        {isBuffering && (
          <View style={styles.centerSpinner} pointerEvents="none">
            <ActivityIndicator size="large" color="#00ADB5" />
            <Text style={styles.spinnerText}>{t.buffering}</Text>
          </View>
        )}

        {/* Control Overlay */}
        {showControls && (
          <View style={styles.controlOverlay}>
            {/* Top Bar */}
            <View style={styles.topControlRow}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={async () => {
                  if (isFullscreen) {
                    await toggleFullscreen();
                  }
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <ChevronLeft size={22} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.titleWrap}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {currentEpisode ? `${movie.title}: ${currentEpisode.title}` : movie.title}
                </Text>
                {movie.quality ? (
                  <View style={styles.qualityTag}>
                    <Text style={styles.qualityTagText}>{movie.quality}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.topActions}>
                {hasSeasons && (
                  <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => setShowEpisodesModal(true)}
                    activeOpacity={0.8}
                  >
                    <Tv size={18} color="#00ADB5" />
                  </TouchableOpacity>
                )}
                {movie.subtitles && movie.subtitles.length > 0 && (
                  <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => setShowSubtitleModal(true)}
                    activeOpacity={0.8}
                  >
                    <Subtitles size={18} color={selectedSubtitle ? "#00ADB5" : "#FFF"} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() => setShowSettingsModal(true)}
                  activeOpacity={0.8}
                >
                  <Settings size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Playback Controls */}
            <View style={styles.centerControlRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={seekBackward} activeOpacity={0.8}>
                <RotateCcw size={26} color="#FFF" />
                <Text style={styles.skipText}>10</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bigPlayBtn} onPress={togglePlayPause} activeOpacity={0.85}>
                {isPlaying ? (
                  <Pause size={30} color="#000" fill="#000" />
                ) : (
                  <Play size={30} color="#000" fill="#000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} onPress={seekForward} activeOpacity={0.8}>
                <RotateCw size={26} color="#FFF" />
                <Text style={styles.skipText}>10</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Progress Bar & Fullscreen Toggle */}
            <View style={styles.bottomControlRow}>
              <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
              
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={durationMillis}
                value={positionMillis}
                minimumTrackTintColor="#00ADB5"
                maximumTrackTintColor="rgba(255,255,255,0.25)"
                thumbTintColor="#00ADB5"
                onSlidingComplete={async (val) => {
                  if (videoRef.current) {
                    await videoRef.current.setPositionAsync(val);
                  }
                  resetControlsTimer();
                }}
              />

              <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>

              <TouchableOpacity style={styles.fullscreenBtn} onPress={toggleFullscreen} activeOpacity={0.8}>
                {isFullscreen ? <Minimize size={18} color="#FFF" /> : <Maximize size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Episodes Picker Modal */}
      {hasSeasons && (
        <Modal visible={showEpisodesModal} transparent animationType="slide" onRequestClose={() => setShowEpisodesModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.episodes}</Text>
                <TouchableOpacity onPress={() => setShowEpisodesModal(false)}>
                  <X size={18} color="#AAA" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 350 }}>
                {movie.seasons![0].episodes.map((ep) => {
                  const isCur = currentEpisode?.id === ep.id;
                  return (
                    <TouchableOpacity
                      key={ep.id}
                      style={[styles.modalItem, isCur && styles.modalItemActive]}
                      onPress={() => {
                        setCurrentEpisode(ep);
                        setShowEpisodesModal(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, isCur && { color: "#00ADB5", fontWeight: "bold" }]}>
                        {ep.episodeNumber}. {ep.title}
                      </Text>
                      {isCur && <Check size={16} color="#00ADB5" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Subtitles Picker Modal */}
      {movie.subtitles && movie.subtitles.length > 0 && (
        <Modal visible={showSubtitleModal} transparent animationType="fade" onRequestClose={() => setShowSubtitleModal(false)}>
          <View style={styles.modalBackdropCenter}>
            <View style={styles.modalCardCenter}>
              <Text style={styles.modalTitleCenter}>{t.subtitles}</Text>
              <TouchableOpacity
                style={[styles.modalItem, !selectedSubtitle && styles.modalItemActive]}
                onPress={() => {
                  setSelectedSubtitle(null);
                  setShowSubtitleModal(false);
                }}
              >
                <Text style={[styles.modalItemText, !selectedSubtitle && { color: "#00ADB5", fontWeight: "bold" }]}>
                  {t.subtitlesOff}
                </Text>
                {!selectedSubtitle && <Check size={16} color="#00ADB5" />}
              </TouchableOpacity>
              {movie.subtitles.map((sub) => {
                const isCur = selectedSubtitle?.id === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.modalItem, isCur && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedSubtitle(sub);
                      setShowSubtitleModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isCur && { color: "#00ADB5", fontWeight: "bold" }]}>
                      {sub.label || sub.language}
                    </Text>
                    {isCur && <Check size={16} color="#00ADB5" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
      )}

      {/* Settings Modal (Speed & Aspect Ratio) */}
      <Modal visible={showSettingsModal} transparent animationType="fade" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalBackdropCenter}>
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalTitleCenter}>{t.preferences}</Text>
            <Text style={styles.sectionSubtitle}>{t.speed}</Text>
            <View style={styles.rateRow}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.rateBtn, playbackRate === rate && styles.rateBtnActive]}
                  onPress={() => {
                    setPlaybackRate(rate);
                    setShowSettingsModal(false);
                  }}
                >
                  <Text style={[styles.rateBtnText, playbackRate === rate && { color: "#000" }]}>{rate}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fullscreenContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  videoWrap: { flex: 1, position: "relative", justifyContent: "center", alignItems: "center" },
  centerSpinner: { position: "absolute", justifyContent: "center", alignItems: "center", gap: 10 },
  spinnerText: { color: "#00ADB5", fontSize: 12, fontWeight: "700" },
  controlOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "space-between", padding: 18 },
  topControlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Platform.OS === "ios" ? 20 : 10 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" },
  titleWrap: { flex: 1, marginHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  movieTitle: { color: "#FFF", fontSize: 14, fontWeight: "800", flexShrink: 1 },
  qualityTag: { backgroundColor: "rgba(0,173,181,0.2)", borderWidth: 1, borderColor: "rgba(0,173,181,0.4)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  qualityTagText: { color: "#00ADB5", fontSize: 9, fontWeight: "800" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  centerControlRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 36 },
  bigPlayBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#00ADB5", justifyContent: "center", alignItems: "center" },
  skipBtn: { alignItems: "center", justifyContent: "center" },
  skipText: { color: "#FFF", fontSize: 10, fontWeight: "800", marginTop: 2 },
  bottomControlRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 8 },
  slider: { flex: 1, height: 40 },
  timeText: { color: "#DDD", fontSize: 11, fontWeight: "600" },
  fullscreenBtn: { padding: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#14141E", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  modalBackdropCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCardCenter: { width: "100%", maxWidth: 340, backgroundColor: "#14141E", borderRadius: 20, padding: 20 },
  modalTitleCenter: { color: "#FFF", fontSize: 16, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  sectionSubtitle: { color: "#888", fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 8 },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#1A1A28", marginBottom: 6 },
  modalItemActive: { backgroundColor: "rgba(0,173,181,0.15)", borderWidth: 1, borderColor: "rgba(0,173,181,0.3)" },
  modalItemText: { color: "#DDD", fontSize: 13, fontWeight: "600" },
  rateRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rateBtn: { flex: 1, minWidth: 60, paddingVertical: 8, backgroundColor: "#1C1C28", borderRadius: 8, alignItems: "center" },
  rateBtnActive: { backgroundColor: "#00ADB5" },
  rateBtnText: { color: "#DDD", fontSize: 12, fontWeight: "700" },
});