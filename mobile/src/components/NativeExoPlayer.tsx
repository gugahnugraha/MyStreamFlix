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
  Lock,
  Unlock,
  Check,
  Sun,
  Scaling,
  Tv,
  ChevronLeft,
  Radio,
  Sliders,
  Maximize,
  Minimize,
  Film,
  Calendar,
  Clock,
  Star,
  Info,
  Type,
  Layers,
} from "lucide-react-native";
import { Movie, Season, Episode, Subtitle } from "../types";
import { translations, LanguageCode } from "../translations";

interface NativeExoPlayerProps {
  movie: Movie;
  initialProgress?: number;
  onClose: () => void;
  brandColor?: string;
  backendUrl?: string;
  language?: LanguageCode;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

// 🌐 Resolves relative / CDN / Google Drive subtitle URLs for React Native fetch
function resolveSubtitleUrl(url: string | undefined, backendUrl: string): string {
  if (!url) return "";
  let trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) {
    return `${backendUrl}${trimmed}`;
  }
  if (trimmed.includes("drive.google.com")) {
    const match = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `${backendUrl}/api/gdrive/stream?id=${match[1]}`;
    }
  }
  return trimmed;
}

// Universal Robust VTT / SRT Subtitle Parser
function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    const h = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    const s = parseFloat(parts[2]) || 0;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const m = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }
  return 0;
}

function parseSubtitles(text: string): Cue[] {
  const cues: Cue[] = [];
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalizedText.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    let timeLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLineIndex = i;
        break;
      }
    }

    if (timeLineIndex === -1) continue;

    const timeParts = lines[timeLineIndex].split("-->");
    if (timeParts.length !== 2) continue;

    const start = parseTimeToSeconds(timeParts[0]);
    const end = parseTimeToSeconds(timeParts[1]);

    const textLines = lines.slice(timeLineIndex + 1);
    const cueText = textLines
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (cueText && end > start) {
      cues.push({ start, end, text: cueText });
    }
  }

  return cues;
}

export default function NativeExoPlayer({
  movie,
  initialProgress = 0,
  onClose,
  brandColor = "#00ADB5",
  backendUrl = "https://mystreamflix.biz.id",
}: NativeExoPlayerProps) {
  const videoRef = useRef<Video>(null);

  // Fullscreen state (default: False / Portrait inline view)
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Quality selector
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto (1080p)");
  const [showQualityModal, setShowQualityModal] = useState(false);

  // Gestures & Toast Feedback
  const [gestureToast, setGestureToast] = useState<{
    type: "volume" | "brightness" | "seek-forward" | "seek-backward";
    value: string;
    percent?: number;
  } | null>(null);

  // Subtitles state
  const [activeSubtitle, setActiveSubtitle] = useState<string>(() => {
    return movie.subtitles && movie.subtitles.length > 0 ? movie.subtitles[0].language : "off";
  });
  const [subtitleCues, setSubtitleCues] = useState<Cue[]>([]);
  const subtitleCuesRef = useRef<Cue[]>([]);
  const [currentCueText, setCurrentCueText] = useState<string>("");
  const [subtitleStyle, setSubtitleStyle] = useState<"shadow" | "clean-yellow" | "clean-teal" | "box" | "yellow" | "teal-box">("shadow");
  const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large" | "xlarge">("medium");

  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  const controlsTimerRef = useRef<any>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  useEffect(() => {
    ScreenOrientation.unlockAsync();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, "fade");
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
      }
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, "fade");
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setVisibilityAsync("visible");
        } catch (e) {}
      }
      setIsFullscreen(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      StatusBar.setHidden(true, "fade");
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync("overlay-swipe");
        } catch (e) {}
      }
      setIsFullscreen(true);
    }
    resetControlsTimer();
  };

  // Fetch subtitle content with domain resolution
  useEffect(() => {
    if (activeSubtitle === "off") {
      setSubtitleCues([]);
      subtitleCuesRef.current = [];
      setCurrentCueText("");
      return;
    }

    const sub = movie.subtitles?.find((s) => s.language === activeSubtitle);
    const rawUrl = sub ? sub.fileUrl || sub.url : "";
    const resolvedUrl = resolveSubtitleUrl(rawUrl, backendUrl);

    if (resolvedUrl) {
      fetch(resolvedUrl)
        .then((res) => res.text())
        .then((text) => {
          const cues = parseSubtitles(text);
          setSubtitleCues(cues);
          subtitleCuesRef.current = cues;
        })
        .catch((err) => {
          console.log("Failed to fetch subtitle from:", resolvedUrl, err);
          subtitleCuesRef.current = [];
        });
    }
  }, [activeSubtitle, movie, backendUrl]);

  // Continuous Subtitle Matcher
  const updateSubtitleCue = (posInSeconds: number) => {
    const cues = subtitleCuesRef.current;
    if (!cues || cues.length === 0) {
      if (currentCueText) setCurrentCueText("");
      return;
    }

    const match = cues.find((c) => posInSeconds >= c.start && posInSeconds <= c.end);
    const newText = match ? match.text : "";
    if (newText !== currentCueText) {
      setCurrentCueText(newText);
    }
  };

  const resetControlsTimer = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !isScreenLocked) {
        setShowControls(false);
      }
    }, 4000);
  };

  const showToast = (toast: {
    type: "volume" | "brightness" | "seek-forward" | "seek-backward";
    value: string;
    percent?: number;
  }) => {
    setGestureToast(toast);
    setTimeout(() => {
      setGestureToast(null);
    }, 1000);
  };

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

  const handleScreenPress = (evt: any) => {
    if (isScreenLocked) return;
    const now = Date.now();
    const screenWidth = Dimensions.get("window").width;
    const touchX = evt.nativeEvent.pageX;

    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      if (touchX > screenWidth / 2) {
        handleSeek(currentTime + 10);
        showToast({ type: "seek-forward", value: "+10s" });
      } else {
        handleSeek(Math.max(0, currentTime - 10));
        showToast({ type: "seek-backward", value: "-10s" });
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: touchX };
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

  const isSeekingRef = useRef(false);

  // ⏩ Smooth Non-Stop Seek (Auto-Plays Immediately)
  const handleSeek = async (timeInSeconds: number) => {
    const target = Math.max(0, Math.min(duration, timeInSeconds));
    setCurrentTime(target);
    updateSubtitleCue(target);
    setIsPlaying(true);
    isSeekingRef.current = true;

    try {
      await videoRef.current?.setStatusAsync({
        positionMillis: target * 1000,
        shouldPlay: true,
      });
    } catch (e) {
      await videoRef.current?.setPositionAsync(target * 1000);
      await videoRef.current?.playAsync();
    }

    setTimeout(() => {
      isSeekingRef.current = false;
    }, 1200);
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

    if (status.isPlaying) {
      setIsBuffering(false);
      setIsPlaying(true);
    } else {
      setIsBuffering(status.isBuffering);
      if (!isSeekingRef.current && !status.isBuffering) {
        setIsPlaying(status.isPlaying);
      }
    }

    const posSec = status.positionMillis / 1000;
    setCurrentTime(posSec);
    updateSubtitleCue(posSec);

    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }
  };

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

  // Resolve target streaming URL
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

  const isLive = movie.contentType === "livetv" || movie.id.startsWith("tv-");

  const subFontSize =
    subtitleSize === "small"
      ? 14
      : subtitleSize === "large"
      ? 20
      : subtitleSize === "xlarge"
      ? 24
      : 17;

  return (
    <View style={[styles.container, isFullscreen ? styles.containerFullscreen : styles.containerInline]}>
      {/* Video Viewport Container */}
      <View style={[styles.playerViewport, isFullscreen && styles.playerViewportFullscreen]}>
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
          progressUpdateIntervalMillis={150}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          usePoster={true}
          posterSource={{ uri: movie.backdropUrl || movie.posterUrl }}
        />

        {/* Screen Brightness Overlay Filter */}
        <View
          pointerEvents="none"
          style={[styles.brightnessOverlay, { opacity: Math.max(0, 1 - brightness) }]}
        />

        {/* 💬 Solid Non-Flicker Subtitle Rendering Engine */}
        {currentCueText ? (
          <View pointerEvents="none" style={styles.subtitleContainer}>
            <View
              style={[
                styles.subtitleDefaultWrapper,
                subtitleStyle === "box" && styles.subtitleBoxStyle,
                subtitleStyle === "yellow" && styles.subtitleYellowStyle,
                subtitleStyle === "teal-box" && styles.subtitleTealBoxStyle,
              ]}
            >
              <Text
                style={[
                  styles.subtitleText,
                  { fontSize: subFontSize },
                  (subtitleStyle === "shadow" || subtitleStyle === "clean-yellow" || subtitleStyle === "clean-teal") &&
                    styles.subtitleShadowStyle,
                  (subtitleStyle === "yellow" || subtitleStyle === "clean-yellow") && { color: "#FACC15" },
                  (subtitleStyle === "teal-box" || subtitleStyle === "clean-teal") && { color: "#00ADB5" },
                ]}
              >
                {currentCueText}
              </Text>
            </View>
          </View>
        ) : null}

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

        {/* Gesture Toast Feedback */}
        {gestureToast && (
          <View style={styles.toastContainer} pointerEvents="none">
            {gestureToast.type === "volume" && <Volume2 size={22} color="#00ADB5" />}
            {gestureToast.type === "brightness" && <Sun size={22} color="#FBBF24" />}
            {gestureToast.type === "seek-forward" && <RotateCw size={22} color="#10B981" />}
            {gestureToast.type === "seek-backward" && <RotateCcw size={22} color="#10B981" />}
            <Text style={styles.toastText}>{gestureToast.value}</Text>
          </View>
        )}

        {/* Touch Lock Floating Button */}
        {isScreenLocked && (
          <TouchableOpacity
            style={styles.floatingUnlockBtn}
            onPress={() => setIsScreenLocked(false)}
          >
            <Lock size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* 🪟 Modern Glassmorphic HUD Controls Layer */}
        {showControls && !isScreenLocked && (
          <View style={styles.hudOverlay} pointerEvents="box-none">
            {/* Top Bar Header */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.glassCircleBtn}>
                <ChevronLeft size={20} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <View style={styles.metaRow}>
                  {isLive ? (
                    <View style={styles.liveBadge}>
                      <Radio size={10} color="#FFF" />
                      <Text style={styles.liveBadgeText}>LIVE STREAM</Text>
                    </View>
                  ) : (
                    <Text style={styles.nowStreamingText}>NOW STREAMING</Text>
                  )}
                  <Text style={styles.qualityTag}>{movie.quality || "1080p HD"}</Text>
                </View>

                <Text style={styles.movieTitle} numberOfLines={1}>
                  {movie.title}
                  {activeEpisode
                    ? ` • S${activeSeason?.seasonNumber}E${activeEpisode.episodeNumber}: ${activeEpisode.title}`
                    : ""}
                </Text>
              </View>

              <View style={styles.topActions}>
                {/* Quality Switcher */}
                <TouchableOpacity onPress={() => setShowQualityModal(true)} style={styles.glassPillBtn}>
                  <Sliders size={12} color="#00ADB5" />
                  <Text style={styles.glassPillText}>{selectedQuality.split(" ")[0]}</Text>
                </TouchableOpacity>

                {/* Aspect Ratio */}
                <TouchableOpacity onPress={cycleAspectRatio} style={styles.glassPillBtn}>
                  <Scaling size={12} color="#00ADB5" />
                  <Text style={styles.glassPillText}>{aspectRatio.toUpperCase()}</Text>
                </TouchableOpacity>

                {/* Lock Screen */}
                <TouchableOpacity onPress={() => setIsScreenLocked(true)} style={styles.glassCircleBtn}>
                  <Unlock size={16} color="#DDD" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Playback Controller */}
            <View style={styles.centerControls} pointerEvents="box-none">
              {!isLive && (
                <TouchableOpacity onPress={() => handleSeek(currentTime - 10)} style={styles.glassRoundSeekBtn}>
                  <RotateCcw size={20} color="#FFF" />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handlePlayPause} style={styles.glassPlayPauseBtn}>
                {isPlaying ? <Pause size={28} color="#FFF" /> : <Play size={28} color="#FFF" fill="#FFF" />}
              </TouchableOpacity>

              {!isLive && (
                <TouchableOpacity onPress={() => handleSeek(currentTime + 10)} style={styles.glassRoundSeekBtn}>
                  <RotateCw size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Control Bar */}
            <View style={styles.bottomBar}>
              {/* Timeline Progress Slider with live drag */}
              {!isLive && (
                <View style={styles.progressRow}>
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={currentTime}
                    onValueChange={(val) => {
                      setCurrentTime(val);
                      updateSubtitleCue(val);
                    }}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor={brandColor}
                    maximumTrackTintColor="rgba(255,255,255,0.25)"
                    thumbTintColor={brandColor}
                  />
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              )}

              {/* Bottom Actions Row */}
              <View style={styles.bottomActionsRow}>
                {/* 🔊 Modern Sleek Extended Volume Bar */}
                <View style={styles.modernVolumePill}>
                  <TouchableOpacity
                    onPress={() => {
                      const targetMute = !isMuted;
                      setIsMuted(targetMute);
                      videoRef.current?.setStatusAsync({ isMuted: targetMute });
                    }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={16} color="#E50914" />
                    ) : (
                      <Volume2 size={16} color="#00ADB5" />
                    )}
                  </TouchableOpacity>

                  <Slider
                    style={[styles.modernVolumeSlider, isFullscreen && { width: 140 }]}
                    minimumValue={0}
                    maximumValue={1}
                    value={isMuted ? 0 : volume}
                    onValueChange={(val) => {
                      setVolume(val);
                      setIsMuted(val === 0);
                      videoRef.current?.setStatusAsync({ volume: val, isMuted: val === 0 });
                    }}
                    minimumTrackTintColor="#00ADB5"
                    maximumTrackTintColor="rgba(255,255,255,0.2)"
                    thumbTintColor="#00ADB5"
                  />
                  <Text style={styles.volPercentText}>{Math.round(volume * 100)}%</Text>
                </View>

                <View style={styles.bottomRightActions}>
                  {/* Speed Selector */}
                  {!isLive && (
                    <TouchableOpacity onPress={() => setShowSpeedModal(true)} style={styles.glassActionBtn}>
                      <Settings size={13} color="#FFF" />
                      <Text style={styles.glassActionText}>{playbackRate}x</Text>
                    </TouchableOpacity>
                  )}

                  {/* Subtitles Selector */}
                  <TouchableOpacity onPress={() => setShowSubtitleModal(true)} style={styles.glassActionBtn}>
                    <Subtitles size={13} color={activeSubtitle !== "off" ? "#00ADB5" : "#FFF"} />
                    <Text style={[styles.glassActionText, activeSubtitle !== "off" && { color: "#00ADB5" }]}>
                      SUB {activeSubtitle !== "off" ? `(${activeSubtitle.toUpperCase()})` : ""}
                    </Text>
                  </TouchableOpacity>

                  {/* Fullscreen Toggle Button */}
                  <TouchableOpacity onPress={toggleFullscreen} style={styles.glassFullscreenBtn}>
                    {isFullscreen ? <Minimize size={16} color="#FFF" /> : <Maximize size={16} color="#FFF" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Details & Episodes List Below Player (When in Portrait Inline Mode) */}
      {!isFullscreen && (
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{movie.title}</Text>
            <View style={styles.detailMetaRow}>
              <Text style={styles.metaYear}>{movie.year || "2024"}</Text>
              <Text style={styles.metaBadge}>{movie.quality || "HD 1080p"}</Text>
              <Text style={styles.metaBadge}>{movie.ageRating || "13+"}</Text>
              {movie.duration ? (
                <View style={styles.metaDuration}>
                  <Clock size={12} color="#888" />
                  <Text style={styles.metaText}>{movie.duration}m</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Synopsis */}
          <Text style={styles.synopsisText}>
            {movie.description || "Stream this amazing title directly on MyStreamFlix with seamless ExoPlayer acceleration."}
          </Text>

          {/* Genres Pills */}
          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.genresRow}>
              {movie.genres.map((g) => (
                <View key={g} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Cast Info */}
          {movie.cast && movie.cast.length > 0 && (
            <View style={styles.castSection}>
              <Text style={styles.castLabel}>Starring: </Text>
              <Text style={styles.castText}>{movie.cast.join(", ")}</Text>
            </View>
          )}

          {/* TV Series Seasons & Episodes List */}
          {movie.contentType === "series" && movie.seasons && (
            <View style={styles.seriesSection}>
              <Text style={styles.seriesSectionTitle}>Seasons & Episodes</Text>
              {movie.seasons.map((season) => (
                <View key={season.id} style={styles.seasonBlock}>
                  <Text style={styles.seasonTitle}>Season {season.seasonNumber}</Text>
                  {season.episodes.map((ep) => {
                    const isCurrent = activeEpisode?.id === ep.id;
                    return (
                      <TouchableOpacity
                        key={ep.id}
                        onPress={() => {
                          setActiveEpisode(ep);
                          setCurrentTime(0);
                        }}
                        style={[styles.inlineEpisodeCard, isCurrent && styles.inlineEpisodeActive]}
                      >
                        <View style={styles.inlineEpNumBadge}>
                          <Text style={[styles.inlineEpNum, isCurrent && { color: "#00ADB5" }]}>
                            {ep.episodeNumber}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inlineEpTitle, isCurrent && { color: "#00ADB5" }]}>
                            {ep.title}
                          </Text>
                          {ep.description ? (
                            <Text style={styles.inlineEpDesc} numberOfLines={2}>
                              {ep.description}
                            </Text>
                          ) : null}
                        </View>
                        {isCurrent ? <Play size={16} color="#00ADB5" fill="#00ADB5" /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* 🪟 Compact Floating Glassmorphic Subtitle Panel (Won't cover the screen!) */}
      <Modal visible={showSubtitleModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowSubtitleModal(false)}>
          <View style={styles.glassModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.glassCompactCard}>
                <View style={styles.glassCardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Subtitles size={16} color="#00ADB5" />
                    <Text style={styles.glassCardTitle}>Subtitles & Styling</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSubtitleModal(false)} style={styles.glassCloseBtn}>
                    <X size={14} color="#AAA" />
                  </TouchableOpacity>
                </View>

                {/* Subtitle Tracks Horizontal / Compact Grid */}
                <Text style={styles.glassMiniLabel}>LANGUAGE</Text>
                <View style={styles.glassPillsWrap}>
                  <TouchableOpacity
                    onPress={() => setActiveSubtitle("off")}
                    style={[styles.glassMiniPill, activeSubtitle === "off" && styles.glassMiniPillActive]}
                  >
                    <Text style={[styles.glassMiniPillText, activeSubtitle === "off" && styles.glassMiniPillTextActive]}>
                      Off
                    </Text>
                  </TouchableOpacity>

                  {movie.subtitles?.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setActiveSubtitle(sub.language)}
                      style={[styles.glassMiniPill, activeSubtitle === sub.language && styles.glassMiniPillActive]}
                    >
                      <Text
                        style={[
                          styles.glassMiniPillText,
                          activeSubtitle === sub.language && styles.glassMiniPillTextActive,
                        ]}
                      >
                        {sub.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {activeSubtitle !== "off" && (
                  <>
                    {/* Subtitle Style Options */}
                    <Text style={[styles.glassMiniLabel, { marginTop: 12 }]}>STYLE PRESET</Text>
                    <View style={styles.glassPillsWrap}>
                      {(["shadow", "clean-yellow", "clean-teal", "box", "yellow", "teal-box"] as const).map(
                        (styleOpt) => (
                          <TouchableOpacity
                            key={styleOpt}
                            onPress={() => setSubtitleStyle(styleOpt)}
                            style={[
                              styles.glassMiniPill,
                              subtitleStyle === styleOpt && styles.glassMiniPillActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.glassMiniPillText,
                                subtitleStyle === styleOpt && styles.glassMiniPillTextActive,
                              ]}
                            >
                              {styleOpt === "shadow"
                                ? "Clean White"
                                : styleOpt === "clean-yellow"
                                ? "Clean Yellow"
                                : styleOpt === "clean-teal"
                                ? "Clean Teal"
                                : styleOpt === "box"
                                ? "Black Box"
                                : styleOpt === "yellow"
                                ? "Yellow Box"
                                : "Teal Box"}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>

                    {/* Font Sizing */}
                    <Text style={[styles.glassMiniLabel, { marginTop: 12 }]}>FONT SIZE</Text>
                    <View style={styles.glassPillsWrap}>
                      {(["small", "medium", "large", "xlarge"] as const).map((sizeOpt) => (
                        <TouchableOpacity
                          key={sizeOpt}
                          onPress={() => setSubtitleSize(sizeOpt)}
                          style={[
                            styles.glassMiniPill,
                            subtitleSize === sizeOpt && styles.glassMiniPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.glassMiniPillText,
                              subtitleSize === sizeOpt && styles.glassMiniPillTextActive,
                            ]}
                          >
                            {sizeOpt.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🪟 Compact Floating Glassmorphic Quality Modal */}
      <Modal visible={showQualityModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowQualityModal(false)}>
          <View style={styles.glassModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.glassCompactCard, { maxWidth: 280 }]}>
                <View style={styles.glassCardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Sliders size={16} color="#00ADB5" />
                    <Text style={styles.glassCardTitle}>Stream Quality</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowQualityModal(false)} style={styles.glassCloseBtn}>
                    <X size={14} color="#AAA" />
                  </TouchableOpacity>
                </View>

                {["Auto (1080p)", "1080p FHD", "720p HD", "480p SD", "360p Low"].map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => {
                      setSelectedQuality(q);
                      setShowQualityModal(false);
                    }}
                    style={[styles.glassItemRow, selectedQuality === q && styles.glassItemRowActive]}
                  >
                    <Text style={[styles.glassItemText, selectedQuality === q && { color: "#00ADB5", fontWeight: "bold" }]}>
                      {q}
                    </Text>
                    {selectedQuality === q && <Check size={16} color="#00ADB5" />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🪟 Compact Floating Glassmorphic Speed Modal */}
      <Modal visible={showSpeedModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowSpeedModal(false)}>
          <View style={styles.glassModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.glassCompactCard, { maxWidth: 260 }]}>
                <View style={styles.glassCardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Settings size={16} color="#00ADB5" />
                    <Text style={styles.glassCardTitle}>Playback Speed</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSpeedModal(false)} style={styles.glassCloseBtn}>
                    <X size={14} color="#AAA" />
                  </TouchableOpacity>
                </View>

                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    onPress={async () => {
                      setPlaybackRate(rate);
                      await videoRef.current?.setStatusAsync({ rate });
                      setShowSpeedModal(false);
                    }}
                    style={[styles.glassItemRow, playbackRate === rate && styles.glassItemRowActive]}
                  >
                    <Text style={[styles.glassItemText, playbackRate === rate && { color: "#00ADB5", fontWeight: "bold" }]}>
                      {rate}x {rate === 1.0 ? "(Normal)" : ""}
                    </Text>
                    {playbackRate === rate && <Check size={16} color="#00ADB5" />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0A0A0C",
  },
  containerInline: {
    flex: 1,
  },
  containerFullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  playerViewport: {
    width: "100%",
    height: 250,
    backgroundColor: "#000",
    position: "relative",
  },
  playerViewportFullscreen: {
    width: "100%",
    height: "100%",
  },
  brightnessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  subtitleContainer: {
    position: "absolute",
    bottom: 45,
    left: 16,
    right: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  subtitleDefaultWrapper: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    maxWidth: "90%",
  },
  subtitleBoxStyle: {
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  subtitleYellowStyle: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  subtitleText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 24,
  },
  subtitleShadowStyle: {
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitleTealBoxStyle: {
    backgroundColor: "rgba(10, 20, 25, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(0, 173, 181, 0.4)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    top: "35%",
    alignSelf: "center",
    backgroundColor: "rgba(18,18,24,0.88)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    gap: 6,
  },
  toastText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
  },
  floatingUnlockBtn: {
    position: "absolute",
    left: 16,
    top: 16,
    backgroundColor: "rgba(229,9,20,0.9)",
    padding: 12,
    borderRadius: 30,
    elevation: 8,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  glassCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(20,20,28,0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E50914",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  nowStreamingText: {
    color: "#00ADB5",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  qualityTag: {
    color: "#888",
    fontSize: 9,
  },
  movieTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  glassPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(20,20,28,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  glassPillText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  glassRoundSeekBtn: {
    backgroundColor: "rgba(20,20,28,0.75)",
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  glassPlayPauseBtn: {
    backgroundColor: "rgba(0,173,181,0.85)",
    padding: 16,
    borderRadius: 40,
    elevation: 6,
  },
  bottomBar: {
    gap: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    color: "#DDD",
    fontSize: 10,
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    fontWeight: "bold",
  },
  slider: {
    flex: 1,
    height: 24,
  },
  bottomActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modernVolumePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,20,28,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  modernVolumeSlider: {
    width: 105,
    height: 18,
  },
  volPercentText: {
    color: "#888",
    fontSize: 9,
    fontWeight: "bold",
    width: 28,
  },
  bottomRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  glassActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(20,20,28,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  glassActionText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  glassFullscreenBtn: {
    padding: 8,
    backgroundColor: "rgba(0,173,181,0.2)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00ADB5",
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    marginBottom: 12,
  },
  detailTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaYear: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "600",
  },
  metaBadge: {
    color: "#FFF",
    fontSize: 10,
    backgroundColor: "#1E1E24",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "bold",
  },
  metaDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#888",
    fontSize: 11,
  },
  synopsisText: {
    color: "#BBB",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  genrePill: {
    backgroundColor: "#141418",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22222A",
  },
  genrePillText: {
    color: "#00ADB5",
    fontSize: 11,
    fontWeight: "600",
  },
  castSection: {
    flexDirection: "row",
    marginBottom: 20,
  },
  castLabel: {
    color: "#777",
    fontSize: 12,
    fontWeight: "bold",
  },
  castText: {
    color: "#AAA",
    fontSize: 12,
    flex: 1,
  },
  seriesSection: {
    marginTop: 10,
  },
  seriesSectionTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
  },
  seasonBlock: {
    marginBottom: 16,
  },
  seasonTitle: {
    color: "#00ADB5",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },
  inlineEpisodeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1E1E24",
    gap: 12,
  },
  inlineEpisodeActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.08)",
  },
  inlineEpNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1E1E24",
    justifyContent: "center",
    alignItems: "center",
  },
  inlineEpNum: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  inlineEpTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  inlineEpDesc: {
    color: "#777",
    fontSize: 10,
    marginTop: 2,
  },
  glassModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  glassCompactCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(18,18,24,0.92)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    elevation: 16,
  },
  glassCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 8,
  },
  glassCardTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  glassCloseBtn: {
    padding: 4,
  },
  glassMiniLabel: {
    color: "#777",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  glassPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  glassMiniPill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  glassMiniPillActive: {
    backgroundColor: "rgba(0,173,181,0.2)",
    borderColor: "#00ADB5",
  },
  glassMiniPillText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  glassMiniPillTextActive: {
    color: "#00ADB5",
    fontWeight: "bold",
  },
  glassItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  glassItemRowActive: {
    backgroundColor: "rgba(0,173,181,0.08)",
  },
  glassItemText: {
    color: "#CCC",
    fontSize: 12,
  },
});
