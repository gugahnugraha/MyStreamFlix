/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Subtitles,
  Settings,
  SkipForward,
  SkipBack,
  Lock,
  Unlock,
  Check,
  SlidersHorizontal,
  Sparkles,
  Tv
} from "lucide-react";
import Hls from "hls.js";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Movie, Subtitle } from "../types";
import { getProxiedStreamUrl, describeQualityLabel, shortQualityHint } from "../lib/stream-utils";
import { isNativeCapacitor, enterImmersiveMode, exitImmersiveMode, addImmersiveStateListener } from "../lib/native-fullscreen";

interface MediaPlayerProps {
  movie: Movie;
  initialProgress?: number; // resume from previous progress in seconds
  onClose: () => void;
  t?: any;
  brandColor?: string;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseSubtitles(text: string): Cue[] {
  const cues: Cue[] = [];
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalizedText.split(/\n\n+/);

  const parseTimeToSeconds = (timeStr: string): number => {
    const match = timeStr.trim().match(/(?:(\d+):)?(\d+):(\d+)[.,](\d+)/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const msStr = match[4].padEnd(3, "0").substring(0, 3);
    const ms = parseInt(msStr, 10);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

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
    const cueText = textLines.join("\n").replace(/<[^>]+>/g, "").trim();

    if (cueText) {
      cues.push({ start, end, text: cueText });
    }
  }

  return cues;
}

export default function MediaPlayer({ movie, initialProgress = 0, onClose, t = {}, brandColor = "#00ADB5" }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startupTimeoutRef = useRef<number | null>(null);
  const bufferTimeoutRef = useRef<number | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // TV Series active episode and season tracking states
  const [activeSeason, setActiveSeason] = useState(() => {
    if (movie.contentType === "series" && movie.seasons && movie.seasons.length > 0) {
      return movie.seasons[0];
    }
    return null;
  });

  const [activeEpisode, setActiveEpisode] = useState(() => {
    if (movie.contentType === "series" && movie.seasons && movie.seasons.length > 0) {
      return movie.seasons[0].episodes[0] || null;
    }
    return null;
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(() => {
    if (movie.contentType === "series" && movie.seasons && movie.seasons.length > 0) {
      return (movie.seasons[0].episodes[0]?.duration || 10) * 60;
    }
    return movie.duration * 60 || 600;
  });
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  // Tracks whether mute was forced by autoplay policy (not by user), so we can show unmute banner
  const [mutedByAutoplay, setMutedByAutoplay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSubtitle, setActiveSubtitle] = useState<string>("off");
  const [parsedSubtitlesMap, setParsedSubtitlesMap] = useState<Record<string, Cue[]>>({});

  // Player Experience Enhancements
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<{index: number; height: number; bitrate: number; label: string}[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Subtitle Customizer States
  const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large" | "xlarge">("medium");
  const [subtitleStyle, setSubtitleStyle] = useState<"shadow" | "box" | "yellow">("shadow");
  const [showSubtitleCustomizer, setShowSubtitleCustomizer] = useState(false);

  // Next Episode Auto-Play States
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null);
  const [isNextEpisodeDismissed, setIsNextEpisodeDismissed] = useState(false);

  const activeSubtitleObj = (movie.subtitles || []).find((s) => s.language === activeSubtitle);

  // Helper to find next episode
  const getNextEpisodeInfo = () => {
    if (movie.contentType !== "series" || !movie.seasons || !activeSeason || !activeEpisode) {
      return null;
    }
    const epIndex = activeSeason.episodes.findIndex((ep) => ep.id === activeEpisode.id);
    if (epIndex !== -1 && epIndex + 1 < activeSeason.episodes.length) {
      return {
        season: activeSeason,
        episode: activeSeason.episodes[epIndex + 1]
      };
    }
    // Try next season
    const seasonIndex = movie.seasons.findIndex((s) => s.id === activeSeason.id);
    if (seasonIndex !== -1 && seasonIndex + 1 < movie.seasons.length) {
      const nextSeason = movie.seasons[seasonIndex + 1];
      if (nextSeason.episodes.length > 0) {
        return {
          season: nextSeason,
          episode: nextSeason.episodes[0]
        };
      }
    }
    return null;
  };

  // Helper to find previous episode
  const getPrevEpisodeInfo = () => {
    if (movie.contentType !== "series" || !movie.seasons || !activeSeason || !activeEpisode) {
      return null;
    }
    const epIndex = activeSeason.episodes.findIndex((ep) => ep.id === activeEpisode.id);
    if (epIndex > 0) {
      return {
        season: activeSeason,
        episode: activeSeason.episodes[epIndex - 1]
      };
    }
    const seasonIndex = movie.seasons.findIndex((s) => s.id === activeSeason.id);
    if (seasonIndex > 0) {
      const prevSeason = movie.seasons[seasonIndex - 1];
      if (prevSeason.episodes.length > 0) {
        return {
          season: prevSeason,
          episode: prevSeason.episodes[prevSeason.episodes.length - 1]
        };
      }
    }
    return null;
  };

  const nextEpisodeInfo = getNextEpisodeInfo();
  const prevEpisodeInfo = getPrevEpisodeInfo();
  const rawStreamUrl = activeEpisode ? activeEpisode.videoUrl : movie.videoUrl;
  const currentStreamUrl = getProxiedStreamUrl(rawStreamUrl);

  // Play next episode
  const handlePlayNextEpisode = () => {
    if (nextEpisodeInfo) {
      setActiveSeason(nextEpisodeInfo.season);
      setActiveEpisode(nextEpisodeInfo.episode);
      setCurrentTime(0);
      setAutoPlayCountdown(null);
      setIsNextEpisodeDismissed(false);
      if (!isSimulating && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Play previous episode
  const handlePlayPrevEpisode = () => {
    if (prevEpisodeInfo) {
      setActiveSeason(prevEpisodeInfo.season);
      setActiveEpisode(prevEpisodeInfo.episode);
      setCurrentTime(0);
      setAutoPlayCountdown(null);
      setIsNextEpisodeDismissed(false);
      if (!isSimulating && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Skip Intro Handler (fast forward 85 seconds)
  const handleSkipIntro = () => {
    const target = Math.min(duration - 5, 85);
    setCurrentTime(target);
    if (!isSimulating && videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  // Auto-play Next Episode Countdown Trigger (when remaining duration <= 15s)
  useEffect(() => {
    if (!nextEpisodeInfo || isNextEpisodeDismissed) return;

    const remaining = duration - currentTime;
    if (remaining <= 15 && remaining > 0 && isPlaying) {
      if (autoPlayCountdown === null) {
        setAutoPlayCountdown(10);
      }
    } else if (remaining > 15 && autoPlayCountdown !== null) {
      setAutoPlayCountdown(null);
    }
  }, [currentTime, duration, isPlaying, nextEpisodeInfo, isNextEpisodeDismissed, autoPlayCountdown]);

  // Auto-play countdown interval timer
  useEffect(() => {
    if (autoPlayCountdown === null) return;
    if (autoPlayCountdown <= 0) {
      handlePlayNextEpisode();
      return;
    }

    const timer = setTimeout(() => {
      setAutoPlayCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoPlayCountdown]);

  // Keep duration in sync with active episode changes
  useEffect(() => {
    if (activeEpisode) {
      setDuration(activeEpisode.duration * 60);
    } else {
      setDuration(movie.duration * 60 || 600);
    }
  }, [activeEpisode, movie.duration]);

  // UI control states
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // Custom mock caption display text
  const [currentCaption, setCurrentCaption] = useState("");

  // Custom Error and Simulation Fallback states
  const [hasError, setHasError] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Landscape detection for safe-area inset side padding (Android APK)
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== "undefined" && window.innerWidth > window.innerHeight
  );

  const clearStreamTimers = () => {
    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
  };

  const stopStream = () => {
    clearStreamTimers();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {}
      video.removeAttribute("src");
      video.load();
    }
  };

  const engageStreamTimeout = () => {
    setIsBuffering(false);
    setHasError(true);
    setIsSimulating(true);
    setIsPlaying(false);
    stopStream();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentStreamUrl) return;

    stopStream();
    setHasError(false);
    setIsSimulating(false);
    setQualityLevels([]);
    setSelectedQuality("Auto");
    setShowQualityMenu(false);
    if (movie.contentType === "livetv") {
      setIsBuffering(true);
      clearStreamTimers();
      startupTimeoutRef.current = window.setTimeout(() => {
        engageStreamTimeout();
      }, 12000) as number;
    }

    if (Hls.isSupported() && currentStreamUrl.includes(".m3u8")) {
      video.removeAttribute("src");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: movie.contentType === "livetv",
        backBufferLength: movie.contentType === "livetv" ? 30 : 90,
        manifestLoadingTimeOut: movie.contentType === "livetv" ? 12000 : undefined,
        levelLoadingTimeOut: movie.contentType === "livetv" ? 12000 : undefined,
        fragLoadingTimeOut: movie.contentType === "livetv" ? 12000 : undefined,
      });
      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        const levels = (data.levels || []).map((lv, idx) => {
          const height = lv.height || 0;
          const bitrate = lv.bitrate || 0;
          const label = describeQualityLabel(height, bitrate) || `Level ${idx + 1}`;
          return { index: idx, height, bitrate, label };
        });
        setQualityLevels(levels);
        video.volume = volume;
        video.muted = false;
        video.play().then(() => {
          setIsPlaying(true);
          setIsMuted(false);
          setMutedByAutoplay(false);
        }).catch((err) => {
          console.warn("Mobile autoplay blocked, attempting muted playback:", err);
          video.muted = true;
          video.volume = volume;
          setIsMuted(true);
          setMutedByAutoplay(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        const lv = (hlsRef.current?.levels || [])[data.level];
        if (lv && hlsRef.current && hlsRef.current.currentLevel === -1) {
          const hint = shortQualityHint(lv.height || 0, lv.bitrate || 0);
          setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
          return;
        }
        setHasError(true);
        setIsSimulating(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL")) {
      video.src = currentStreamUrl;
      video.volume = volume;
      video.muted = false;
      video.load();
      video.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        setMutedByAutoplay(false);
      }).catch(() => {
        video.muted = true;
        video.volume = volume;
        setIsMuted(true);
        setMutedByAutoplay(true);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else {
      video.src = currentStreamUrl;
      video.volume = volume;
      video.muted = false;
      video.load();
      video.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        setMutedByAutoplay(false);
      }).catch(() => setIsPlaying(false));
    }

    return () => {
      clearStreamTimers();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStreamUrl, movie.contentType]);

  useEffect(() => {
    if (movie.contentType !== "livetv") return;
    if (!isBuffering) {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      return;
    }
    if (!bufferTimeoutRef.current) {
      bufferTimeoutRef.current = window.setTimeout(() => {
        engageStreamTimeout();
      }, 20000) as number;
    }
    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
    };
  }, [isBuffering, movie.contentType]);

  // Sync audio state (volume & muted) to the real <video> element.
  // React's <video volume/muted> props are not reliably reactive across browsers.
  useEffect(() => {
    if (isSimulating) return;
    const video = videoRef.current;
    if (!video) return;
    try {
      if (typeof video.volume === "number") {
        const newVol = Math.max(0, Math.min(1, Number(volume) || 0));
        if (Math.abs(video.volume - newVol) > 0.001) video.volume = newVol;
      }
      if (video.muted !== Boolean(isMuted)) video.muted = Boolean(isMuted);
    } catch {}
  }, [volume, isMuted, isSimulating, currentStreamUrl]);

  // Auto-hide controls overlay
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      if (isScreenLocked) return;
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
          setShowSubtitleMenu(false);
          setShowQualityMenu(false);
          setShowSubtitleCustomizer(false);
        }
      }, 3500);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetTimer);
      container.addEventListener("click", resetTimer);
      container.addEventListener("touchstart", resetTimer);
    }

    resetTimer();

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener("mousemove", resetTimer);
        container.removeEventListener("click", resetTimer);
        container.removeEventListener("touchstart", resetTimer);
      }
    };
  }, [isPlaying, isScreenLocked]);

  // Auto-collapse expanded popup menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInsideMenuOrToggle = target.closest?.(".player-menu-popover") || target.closest?.(".player-menu-btn");
      if (!isInsideMenuOrToggle) {
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
        setShowSubtitleMenu(false);
        setShowSubtitleCustomizer(false);
      }
    };

    if (showQualityMenu || showSpeedMenu || showSubtitleMenu || showSubtitleCustomizer) {
      window.addEventListener("mousedown", handleOutsideClick, true);
      window.addEventListener("touchstart", handleOutsideClick, true);
    }

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick, true);
      window.removeEventListener("touchstart", handleOutsideClick, true);
    };
  }, [showQualityMenu, showSpeedMenu, showSubtitleMenu, showSubtitleCustomizer]);

  // Listen to fullscreen changes & handle screen orientation
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        ScreenOrientation.unlock().catch(() => {
          try {
            const orientation = (screen as any).orientation || (window.screen as any).orientation;
            if (orientation && typeof orientation.unlock === "function") {
              orientation.unlock();
            }
          } catch (e) {}
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Native Capacitor immersive fullscreen events (Android APK)
    let removeNativeListener = () => {};
    if (isNativeCapacitor()) {
      addImmersiveStateListener((data) => {
        const isFs = !!data.isFullscreen;
        setIsFullscreen(isFs);
        if (!isFs) {
          ScreenOrientation.unlock().catch(() => {
            try {
              const orientation = (screen as any).orientation || (window.screen as any).orientation;
              if (orientation && typeof orientation.unlock === "function") {
                orientation.unlock();
              }
            } catch (e) {}
          });
        }
      }).then((unsub) => {
        removeNativeListener = unsub;
      });
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      removeNativeListener();
      ScreenOrientation.unlock().catch(() => {
        try {
          const orientation = (screen as any).orientation || (window.screen as any).orientation;
          if (orientation && typeof orientation.unlock === "function") {
            orientation.unlock();
          }
        } catch (e) {}
      });
    };
  }, []);

  // Landscape orientation listener — updates isLandscape on device rotation (Android APK)
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  // Video Initialization & Resume Point
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Always sync volume and unmute state on new content load
      video.volume = volume;
      video.muted = false;

      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        if (initialProgress > 0 && initialProgress < video.duration - 5) {
          video.currentTime = initialProgress;
        }
        video.volume = volume;
        video.muted = false;
        video.play().then(() => {
          setIsPlaying(true);
          setIsMuted(false);
          setMutedByAutoplay(false);
          setHasError(false);
          setIsSimulating(false);
        }).catch((err) => {
          console.warn("Direct stream play failed, falling back to Interactive Simulation mode:", err?.message || "Playback block");
          setIsSimulating(true);
          setIsPlaying(true);
        });
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    } else {
      setIsSimulating(true);
      setIsPlaying(true);
    }
  }, [movie.id, activeEpisode?.id]);

  // Simulation player timeline progression
  useEffect(() => {
    if (!isSimulating || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + playbackRate;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, isPlaying, playbackRate, duration]);

  // Background Beacon: Save streaming progress
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const curr = isSimulating ? Math.round(currentTime) : (videoRef.current ? Math.round(videoRef.current.currentTime) : 0);
      const dur = isSimulating ? Math.round(duration) : (videoRef.current ? Math.round(videoRef.current.duration || 100) : 100);
      if (curr > 0 && dur > 0) {
        fetch("/api/user/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: movie.id,
            progress: curr,
            duration: dur
          })
        }).catch((err) => console.warn("Failed syncing continue progress beacon:", err));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, isSimulating, currentTime, duration, movie.id]);

  // Sync caption text
  useEffect(() => {
    if (activeSubtitle === "off") {
      setCurrentCaption("");
      return;
    }

    const cues = parsedSubtitlesMap[activeSubtitle];
    if (cues && cues.length > 0) {
      const activeCue = cues.find((cue) => currentTime >= cue.start && currentTime <= cue.end);
      setCurrentCaption(activeCue ? activeCue.text : "");
      return;
    }

    if (isSimulating) {
      const timeSec = Math.round(currentTime);
      const captionsMap: Record<string, Record<number, string>> = {
        en: {
          2: "This is a demonstration of the FlixSphere HLS Player.",
          6: "Now showcasing pristine video compression & sound mixing.",
          10: "Feel free to scrub anywhere to trigger instant resume points.",
          15: "FlixSphere delivers marketplace-quality content rendering.",
          25: "Enjoy the high-fidelity cinematic experience."
        },
        id: {
          2: "Ini adalah demonstrasi dari FlixSphere HLS Player.",
          6: "Menampilkan kompresi video murni & pencampuran suara yang luar biasa.",
          10: "Silakan geser waktu (scrub) untuk mencoba fitur resume instan.",
          15: "FlixSphere menyajikan rendering konten berkualitas pasar premium.",
          25: "Nikmati pengalaman sinematik dengan fidelitas tinggi."
        }
      };

      const activeCap = captionsMap[activeSubtitle];
      if (activeCap) {
        const matched = Object.keys(activeCap)
          .map(Number)
          .sort((a, b) => b - a)
          .find((sec) => timeSec >= sec && timeSec < sec + 4);

        if (matched !== undefined) {
          setCurrentCaption(activeCap[matched]);
        } else {
          setCurrentCaption("");
        }
      } else {
        setCurrentCaption("");
      }
    } else {
      setCurrentCaption("");
    }
  }, [currentTime, activeSubtitle, parsedSubtitlesMap, isSimulating]);

  const subtitlesString = JSON.stringify(movie.subtitles || []);

  useEffect(() => {
    const processSubs = async () => {
      const map: Record<string, Cue[]> = {};
      await Promise.all(
        (movie.subtitles || []).map(async (sub) => {
          if (!sub.fileUrl || !sub.fileUrl.trim()) return;

          try {
            const isRemote = sub.fileUrl.startsWith("http://") || sub.fileUrl.startsWith("https://");
            const fetchUrl = isRemote
              ? `/api/subtitles?url=${encodeURIComponent(sub.fileUrl)}`
              : sub.fileUrl;

            const response = await fetch(fetchUrl);
            if (!response.ok) return;
            const text = await response.text();
            const cues = parseSubtitles(text);
            map[sub.language] = cues;
          } catch (err) {
            console.warn(`Failed loading subtitle for ${sub.language}:`, err);
          }
        })
      );
      setParsedSubtitlesMap(map);
    };

    processSubs();
  }, [subtitlesString]);

  // Player controls actions
  const handlePlayPause = () => {
    if (isScreenLocked) return;
    if (isSimulating) {
      setIsPlaying(!isPlaying);
    } else {
      const video = videoRef.current;
      if (video) {
        if (isPlaying) {
          video.pause();
          setIsPlaying(false);
        } else {
          video.play().then(() => {
            setIsPlaying(true);
            if (mutedByAutoplay || (video.muted && !isMuted)) {
              const safeVol = volume > 0 ? volume : 0.8;
              video.volume = safeVol;
              video.muted = false;
              setVolume(safeVol);
              setIsMuted(false);
              setMutedByAutoplay(false);
            }
          }).catch((err) => {
            console.warn("Direct stream play blocked, activating interactive simulation:", err);
            setIsSimulating(true);
            setIsPlaying(true);
          });
        }
      } else {
        setIsSimulating(true);
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isScreenLocked) return;
    const seekVal = Number(e.target.value);
    setCurrentTime(seekVal);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = seekVal;
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    const shouldMute = vol === 0;
    setIsMuted(shouldMute);
    setMutedByAutoplay(false);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.volume = vol;
        video.muted = shouldMute; // Always sync muted with volume slider
      }
    }
  };

  const handleMuteToggle = () => {
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    setMutedByAutoplay(false);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.muted = targetMute;
        // Ensure volume is audible when unmuting
        if (!targetMute && video.volume === 0) {
          const safeVol = volume > 0 ? volume : 0.8;
          video.volume = safeVol;
          setVolume(safeVol);
        }
      }
    }
  };

  const handleSkip = (seconds: number) => {
    if (isScreenLocked) return;
    const targetTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(targetTime);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = targetTime;
      }
    }
  };

  const handleSpeedSelect = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = rate;
      }
    }
  };

  const handleQualitySelect = (mode: "auto" | number) => {
    const hls = hlsRef.current;
    if (mode === "auto") {
      if (hls) {
        hls.currentLevel = -1;
        const lv = hls.levels[hls.autoLevelCapping];
        if (lv) {
          const hint = shortQualityHint(lv.height || 0, lv.bitrate || 0);
          setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
        } else {
          setSelectedQuality("Auto");
        }
      } else {
        setSelectedQuality("Auto");
      }
    } else {
      if (hls) {
        hls.currentLevel = mode;
        const lv = hls.levels[mode];
        if (lv) {
          const label = describeQualityLabel(lv.height || 0, lv.bitrate || 0) || `Level ${mode + 1}`;
          setSelectedQuality(label);
        }
      } else {
        const lv = qualityLevels.find((l) => l.index === mode);
        setSelectedQuality(lv?.label || "Auto");
      }
    }
    setShowQualityMenu(false);
  };

  const handleScreenClick = () => {
    if (isScreenLocked) return;
    if (isPlaying) {
      setShowControls((prev) => !prev);
    } else {
      handlePlayPause();
    }
  };

  const handleSubtitleSelect = (lang: string) => {
    setActiveSubtitle(lang);
    setShowSubtitleMenu(false);
  };

  const toggleFullscreen = async () => {
    const targetFs = !isFullscreen;
    setIsFullscreen(targetFs);

    // 1. Native Capacitor ScreenOrientation locking (APK only)
    if (isNativeCapacitor()) {
      try {
        if (targetFs) {
          await ScreenOrientation.lock({ orientation: "landscape" });
        } else {
          await ScreenOrientation.unlock();
        }
      } catch (err) {
        // Ignore — orientation lock is best-effort on APK
      }

      // 2. Native immersive fullscreen (Capacitor APK) - hides Android system bars
      if (targetFs) {
        await enterImmersiveMode();
      } else {
        await exitImmersiveMode();
      }
      return;
    }

    // 3. Browser Screen Orientation API fallback (web browsers)
    try {
      const orientation = (screen as any).orientation || (window.screen as any).orientation;
      if (targetFs && orientation && typeof orientation.lock === "function") {
        orientation.lock("landscape").catch(() => {});
      } else if (!targetFs && orientation && typeof orientation.unlock === "function") {
        orientation.unlock();
      }
    } catch (e) {}

    // 4. HTML5 Fullscreen API (for Web Browsers)
    const container = containerRef.current;
    if (!container) return;
    if (targetFs) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleClosePlayer = async () => {
    // Exit native immersive fullscreen first (Android APK)
    if (isNativeCapacitor()) {
      try {
        await exitImmersiveMode();
      } catch (e) {}
    }
    try {
      await ScreenOrientation.unlock();
    } catch (e) {
      try {
        const orientation = (screen as any).orientation || (window.screen as any).orientation;
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock();
        }
      } catch (err) {}
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getSubtitleStyleClasses = () => {    let sizeClass = "text-base md:text-xl";
    if (subtitleSize === "small") sizeClass = "text-xs md:text-sm";
    if (subtitleSize === "large") sizeClass = "text-lg md:text-2xl";
    if (subtitleSize === "xlarge") sizeClass = "text-xl md:text-3xl";

    let bgStyle = "drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-white";
    if (subtitleStyle === "box") bgStyle = "bg-black/85 px-3 py-1.5 rounded-md text-white border border-white/10";
    if (subtitleStyle === "yellow") bgStyle = "drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-yellow-300 font-extrabold";

    return `${sizeClass} ${bgStyle}`;
  };

  // Safe-area HUD padding for Android APK.
  // Non-fullscreen portrait: add 16px extra above the system nav bar.
  // Fullscreen / landscape: use only the env() inset (bars are hidden by immersive mode).
  const hudStyle: React.CSSProperties = isNativeCapacitor()
    ? {
        paddingBottom:
          isFullscreen || isLandscape
            ? "env(safe-area-inset-bottom, 0px)"
            : "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        paddingLeft:
          isFullscreen || isLandscape
            ? "env(safe-area-inset-left, 0px)"
            : undefined,
        paddingRight:
          isFullscreen || isLandscape
            ? "env(safe-area-inset-right, 0px)"
            : undefined,
      }
    : {};

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row landscape:flex-row justify-between overflow-hidden" id="media-player-root">
        {(!showControls || isScreenLocked || isBuffering) && (
          <button
            onClick={handleClosePlayer}
            className="absolute right-4 z-[60] w-11 h-11 rounded-full bg-zinc-900/80 hover:bg-red-600 text-white flex items-center justify-center border border-zinc-800 transition-colors shadow-lg cursor-pointer"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
            title={t.exitPlayer || "Exit Player"}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      <style>{`
        video::cue, #video-core-element::cue {
          background: transparent !important;
          background-color: transparent !important;
          color: #ffffff !important;
          text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.9), 0px 1px 2px rgba(0, 0, 0, 0.9);
        }
      `}</style>
      
      {/* Primary Video Screen Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden"
      >
        {/* HTML5 Video Layer */}
        {!isSimulating ? (
          <video
            ref={videoRef}
            className="w-full h-full max-h-screen object-contain"
            onClick={handleScreenClick}
            muted={isMuted}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onWaiting={() => setIsBuffering(true)}
            onSeeking={() => setIsBuffering(true)}
            onCanPlay={() => {
              setIsBuffering(false);
              clearStreamTimers();
            }}
            onPlaying={() => {
              setIsBuffering(false);
              clearStreamTimers();
              if (mutedByAutoplay) {
                const video = videoRef.current;
                if (video) {
                  const safeVol = volume > 0 ? volume : 0.8;
                  video.volume = safeVol;
                  video.muted = false;
                  setVolume(safeVol);
                  setIsMuted(false);
                }
                setMutedByAutoplay(false);
              }
            }}
            onVolumeChange={() => {
              const video = videoRef.current;
              if (video) {
                setVolume(video.volume);
                setIsMuted(video.muted);
                if (!video.muted && video.volume > 0) setMutedByAutoplay(false);
              }
            }}
            onSeeked={() => setIsBuffering(false)}
            onEnded={() => {
              setIsPlaying(false);
              setIsBuffering(false);
              clearStreamTimers();
              if (nextEpisodeInfo) {
                handlePlayNextEpisode();
              }
            }}
            onError={() => {
              console.warn("Direct stream load failed. Engaging high-fidelity cinematic stream simulation.");
              setIsBuffering(false);
              setHasError(true);
              setIsSimulating(true);
              setIsPlaying(true);
              clearStreamTimers();
            }}
            id="video-core-element"
          />
        ) : (
          /* High-fidelity Simulation Display */
          <div
          className="relative w-full h-full min-h-[100svh] md:min-h-0 flex items-center justify-center bg-zinc-950"
            onClick={handleScreenClick}
            id="simulation-display"
          >
            {/* Animated Zooming Background */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-xs transition-transform duration-1000 scale-105"
              style={{
                backgroundImage: `url(${movie.backdropUrl})`,
                transform: isPlaying ? `scale(${1.08 + Math.sin(currentTime / 10) * 0.03}) rotate(${Math.sin(currentTime / 20) * 0.5}deg)` : "scale(1.05)"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950" />

            {/* Glowing Center Art Frame */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-lg">
              <div className="relative w-48 h-72 md:w-56 md:h-80 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] border border-zinc-800 mb-6 group transition-all duration-500 hover:shadow-[0_0_70px_rgba(239,68,68,0.4)]">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-1.5 self-start">
                    <span className="px-2 py-0.5 rounded-sm bg-red-600 text-[10px] font-extrabold text-white uppercase tracking-wider">
                      {t.simulated || "SIMULATED"}
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-zinc-900/85 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
                      {selectedQuality !== "Auto" ? selectedQuality : movie.quality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-red-500 font-mono tracking-widest uppercase">
                  {t.interactiveStream || "Interactive Cinema Stream"}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {movie.title} {activeEpisode ? ` - S${activeSeason?.seasonNumber}E${activeEpisode.episodeNumber}` : ""}
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mt-1">
                  {movie.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Glowing Glassmorphism Buffering Spinner Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-40 space-y-4 pointer-events-none animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="w-16 h-16 rounded-full border-2 border-[#00ADB5]/30 animate-ping absolute" />
              {/* Spinning gradient ring */}
              <div className="w-14 h-14 rounded-full border-3 border-transparent border-t-[#00ADB5] border-r-cyan-400 border-b-teal-500 animate-spin shadow-[0_0_25px_rgba(0,173,181,0.5)]" />
              {/* Inner brand glow dot */}
              <div className="w-4 h-4 rounded-full bg-[#00ADB5] shadow-[0_0_15px_#00ADB5] absolute animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs font-black tracking-widest text-[#00ADB5] uppercase font-mono animate-pulse block">
                {t?.bufferingStream || "Buffering stream..."}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium block">
                {movie.title}
              </span>
            </div>
          </div>
        )}

        {/* Styled Caption Subtitle Overlay */}
        {currentCaption && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 text-center max-w-3xl font-bold select-none pointer-events-none transition-all duration-300 ${
              showControls ? "bottom-32" : "bottom-12"
            } ${getSubtitleStyleClasses()}`}
          >
            {currentCaption}
          </div>
        )}

        {/* SKIP INTRO BUTTON – Only for TV Series */}
        {currentTime >= 5 && currentTime <= 90 && !isScreenLocked && movie.contentType === "series" && (
          <button
            onClick={handleSkipIntro}
            className="absolute bottom-28 left-6 md:left-12 z-30 px-4 py-2 bg-black/85 hover:bg-red-600 text-white font-extrabold text-xs md:text-sm rounded-lg border border-white/20 shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>{t.skipIntro || "Skip Intro / Lewati Intro"}</span>
            <SkipForward className="w-4 h-4" />
          </button>
        )}

        {/* NEXT EPISODE AUTO-PLAY COUNTDOWN OVERLAY CARD (Disabled for Live TV) */}
        {autoPlayCountdown !== null && nextEpisodeInfo && !isNextEpisodeDismissed && movie.contentType !== "livetv" && (
          <div className="absolute bottom-28 right-6 md:right-12 z-30 p-4 bg-zinc-950/95 border border-red-600/50 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.3)] backdrop-blur-xl flex flex-col gap-3 max-w-xs animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                {t.nextEpisodeIn || "NEXT EPISODE IN"} {autoPlayCountdown}s
              </span>
              <button
                onClick={() => setIsNextEpisodeDismissed(true)}
                className="text-zinc-400 hover:text-white text-xs p-1"
                title="Cancel Auto-play"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">
                S{nextEpisodeInfo.season.seasonNumber}:E{nextEpisodeInfo.episode.episodeNumber}
              </p>
              <h4 className="text-sm font-extrabold text-white truncate mt-0.5">
                {nextEpisodeInfo.episode.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handlePlayNextEpisode}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t.playNow || "Play Now"}</span>
              </button>
              <button
                onClick={() => setIsNextEpisodeDismissed(true)}
                className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl transition-all border border-zinc-800 cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN LOCK FLOATING ICON (When Locked) */}
        {isScreenLocked && (
          <div className="absolute left-6 z-50" style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
            <button
              onClick={() => setIsScreenLocked(false)}
              className="p-3.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center border border-white/20 transition-all transform active:scale-90 cursor-pointer backdrop-blur-md"
              title="Unlock Screen Controls"
            >
              <Lock className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* HUD CONTROLLER OVERLAY SCREEN */}
        <div
          className={`absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/80 flex flex-col justify-between p-3 sm:p-4 md:p-8 transition-opacity duration-300 ${
            showControls && !isScreenLocked ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          id="media-player-hud"
          onClick={(e) => {
            // Tap on empty HUD space toggles controls (better mobile UX). Buttons stop propagation.
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (target.closest?.("button") || target.closest?.(".player-menu-popover")) return;
            if (target.closest?.("input")) return;
            handleScreenClick();
          }}
        >
          {/* Top Header Row */}
          <div className="flex items-center justify-between w-full z-10 pt-safe">
            <div>
              <p className="text-[10px] md:text-xs font-bold text-red-500 font-mono tracking-wider">
                {t.nowStreaming || "NOW STREAMING"} • {selectedQuality !== "Auto" ? selectedQuality : movie.quality}
              </p>
              <h1 className="text-white text-base md:text-xl font-extrabold truncate max-w-md mt-0.5">
                {movie.title} {activeEpisode ? ` • S${activeSeason?.seasonNumber}E${activeEpisode.episodeNumber}: ${activeEpisode.title}` : ""}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Screen Lock Toggle */}
              <button
                onClick={() => setIsScreenLocked(true)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800 transition-colors shadow-lg cursor-pointer z-20"
                title="Lock Screen Touch"
              >
                <Unlock className="w-5 h-5 text-zinc-300" />
              </button>

              <button
                onClick={handleClosePlayer}
                className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-zinc-900/80 hover:bg-red-600 text-white flex items-center justify-center border border-zinc-800 transition-colors shadow-lg cursor-pointer z-20"
                id="media-player-exit"
                title={t.exitPlayer || "Exit Player"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Large Center Play/Pause, Rewind, Forward & Episode Skip Controls */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 sm:gap-8 pointer-events-none z-10">
            {/* Prev Episode Button (Series only) */}
            {prevEpisodeInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPrevEpisode();
                }}
                title="Previous Episode"
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl pointer-events-auto transition-all duration-300 transform active:scale-90 hover:bg-white/20 ${
                  showControls ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                }`}
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkip(-10);
              }}
              title={t.rewind10s || "Rewind 10s"}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl pointer-events-auto transition-all duration-300 transform active:scale-90 hover:bg-white/20 ${
                showControls ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
              }`}
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/70 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-2xl pointer-events-auto transition-all duration-300 transform active:scale-90 hover:bg-white/20 ${
                showControls ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
              ) : (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkip(10);
              }}
              title={t.forward10s || "Forward 10s"}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl pointer-events-auto transition-all duration-300 transform active:scale-90 hover:bg-white/20 ${
                showControls ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
              }`}
            >
              <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Next Episode Button (Series only) */}
            {nextEpisodeInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayNextEpisode();
                }}
                title="Next Episode"
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl pointer-events-auto transition-all duration-300 transform active:scale-90 hover:bg-white/20 ${
                  showControls ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                }`}
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Bottom Playback HUD panel */}
            <div className="space-y-3 sm:space-y-4" id="media-player-bottom-hud" style={hudStyle}>
            {/* Progress Timeline Scrubber or Live Stream Indicator */}
            {movie.contentType === "livetv" ? (
              <div className="flex items-center justify-between w-full px-3 py-1.5 bg-red-950/40 border border-red-600/30 rounded-xl backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                  </span>
                  <span className="text-xs font-black text-white tracking-widest uppercase">
                    LIVE BROADCASTING
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider bg-red-600/20 px-2 py-0.5 rounded border border-red-500/30">
                  REAL-TIME STREAM
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <span className="text-xs font-mono text-zinc-400 shrink-0">
                  {formatTime(currentTime)}
                </span>

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-red-600 bg-zinc-800 h-1 hover:h-1.5 rounded-lg appearance-none cursor-pointer transition-all"
                  id="media-progress-slider"
                />

                <span className="text-xs font-mono text-zinc-400 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Controls Bar Row */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 py-1">
              {/* Left Section: Playback Controls & Volume */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {isFullscreen && (
                  <div className="flex items-center gap-2 pr-2 border-r border-zinc-800/80">
                    <button
                      onClick={() => handleSkip(-10)}
                      className="text-zinc-300 hover:text-white transition-all transform active:scale-90 p-2 cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
                      title={t.rewind10s || "Rewind 10s"}
                    >
                      <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                      onClick={handlePlayPause}
                      className="w-11 h-11 rounded-full bg-white text-black hover:scale-105 transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95"
                      id="hud-play-btn"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-black fill-black" />
                      ) : (
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleSkip(10)}
                      className="text-zinc-300 hover:text-white transition-all transform active:scale-90 p-2 cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
                      title={t.forward10s || "Forward 10s"}
                    >
                      <RotateCw className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                )}

                {/* Volume Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMuteToggle}
                    className="text-zinc-300 hover:text-white transition-colors cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
                    id="hud-mute-btn"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-red-500" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="hidden md:block w-20 md:w-24 accent-red-600 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    id="hud-volume-slider"
                  />
                </div>
              </div>

              {/* Right Section: Video Quality, Speed, Subtitles & Customizer */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 relative">
                {/* Video Quality Selector */}
                {qualityLevels.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowQualityMenu(!showQualityMenu);
                        setShowSpeedMenu(false);
                        setShowSubtitleMenu(false);
                        setShowSubtitleCustomizer(false);
                      }}
                      className="player-menu-btn px-3 py-2 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer min-h-11"
                      title="Video Quality"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: brandColor }} />
                      <span className="hidden sm:inline whitespace-nowrap">{selectedQuality}</span>
                    </button>

                    {showQualityMenu && (
                      <div className="player-menu-popover absolute bottom-12 right-0 z-50 w-56 rounded-xl bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest font-mono" style={{ color: brandColor }}>
                            {t.videoQuality || "Video Quality"}
                          </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                          <button
                            onClick={() => handleQualitySelect("auto")}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold transition-all hover:bg-white/10 cursor-pointer text-white`}
                            style={selectedQuality.startsWith("Auto") ? { backgroundColor: `${brandColor}25`, color: brandColor } : undefined}
                          >
                            <span>Auto</span>
                            {selectedQuality.startsWith("Auto") && <Check className="w-3.5 h-3.5" style={{ color: brandColor }} />}
                          </button>
                          {qualityLevels
                            .slice()
                            .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
                            .map((lv) => {
                              const active = !selectedQuality.startsWith("Auto") && selectedQuality === lv.label;
                              return (
                                <button
                                  key={lv.index}
                                  onClick={() => handleQualitySelect(lv.index)}
                                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-all hover:bg-white/10 cursor-pointer ${active ? "text-white" : "text-zinc-200"}`}
                                  style={active ? { backgroundColor: `${brandColor}25`, color: brandColor } : undefined}
                                >
                                  <span>{lv.label}</span>
                                  {active && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: brandColor }} />}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Playback speed selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowQualityMenu(false);
                      setShowSubtitleMenu(false);
                      setShowSubtitleCustomizer(false);
                    }}
                    className="player-menu-btn flex items-center gap-1.5 text-zinc-300 hover:text-white text-xs font-semibold px-2.5 py-2 sm:py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg transition-colors cursor-pointer min-h-11"
                    title={t.playbackSpeed || "Playback Speed"}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{playbackRate}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="player-menu-popover absolute bottom-10 right-0 w-28 bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl shadow-2xl flex flex-col gap-0.5 z-50">
                      {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleSpeedSelect(r)}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-900 transition-colors ${
                            playbackRate === r ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                          }`}
                        >
                          {r}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitle Selector & Subtitle Style Customizer */}
                {movie.subtitles.length > 0 && (
                  <div className="relative flex items-center gap-1">
                    <button
                      onClick={() => {
                        setShowSubtitleMenu(!showSubtitleMenu);
                        setShowQualityMenu(false);
                        setShowSpeedMenu(false);
                        setShowSubtitleCustomizer(false);
                      }}
                      className={`player-menu-btn flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 sm:py-1 border rounded-lg transition-colors cursor-pointer min-h-11 ${
                        activeSubtitle !== "off"
                          ? "bg-red-600/10 border-red-500 text-red-400 font-bold"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white"
                      }`}
                      title={t.toggleCaptions || "Toggle Captions"}
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{activeSubtitleObj ? activeSubtitleObj.label : (t.toggleCaptions || "Subtitles")}</span>
                    </button>

                    {/* Subtitle Style Customizer Toggle */}
                    <button
                      onClick={() => {
                        setShowSubtitleCustomizer(!showSubtitleCustomizer);
                        setShowSubtitleMenu(false);
                        setShowQualityMenu(false);
                        setShowSpeedMenu(false);
                      }}
                      className="player-menu-btn p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
                      title="Subtitle Settings (Size & Style)"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* Subtitle Language Menu */}
                    {showSubtitleMenu && (
                      <div className="player-menu-popover absolute bottom-10 right-0 w-36 bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl shadow-2xl flex flex-col gap-0.5 z-50">
                        <button
                          onClick={() => handleSubtitleSelect("off")}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-900 transition-colors ${
                            activeSubtitle === "off" ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                          }`}
                        >
                          {t.noneOff || "Off (None)"}
                        </button>
                        {movie.subtitles.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubtitleSelect(sub.language)}
                            className={`text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-900 transition-colors ${
                              activeSubtitle === sub.language ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Subtitle Customizer Panel */}
                    {showSubtitleCustomizer && (
                      <div className="player-menu-popover absolute bottom-10 right-0 w-52 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl shadow-2xl flex flex-col gap-3 z-50">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Subtitle Size
                          </p>
                          <div className="grid grid-cols-4 gap-1">
                            {(["small", "medium", "large", "xlarge"] as const).map((sz) => (
                              <button
                                key={sz}
                                onClick={() => setSubtitleSize(sz)}
                                className={`text-[10px] py-1 rounded-md border capitalize font-semibold transition-colors ${
                                  subtitleSize === sz
                                    ? "bg-red-600 border-red-500 text-white font-bold"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                }`}
                              >
                                {sz.replace("xlarge", "XL")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Subtitle Style
                          </p>
                          <div className="flex flex-col gap-1">
                            {[
                              { id: "shadow", label: "Shadow Text" },
                              { id: "box", label: "Black Box" },
                              { id: "yellow", label: "Yellow Cinema" }
                            ].map((st) => (
                              <button
                                key={st.id}
                                onClick={() => setSubtitleStyle(st.id as any)}
                                className={`text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-900 transition-colors flex items-center justify-between ${
                                  subtitleStyle === st.id ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                                }`}
                              >
                                <span>{st.label}</span>
                                {subtitleStyle === st.id && <Check className="w-3.5 h-3.5 text-red-500" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fullscreen control */}
                <button
                  onClick={toggleFullscreen}
                  className="text-zinc-300 hover:text-white transition-colors cursor-pointer min-w-11 min-h-11 flex items-center justify-center hover:scale-105 active:scale-95"
                  title={isFullscreen ? (t.exitFullscreen || "Exit Fullscreen") : (t.toggleFullscreen || "Toggle Fullscreen")}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-red-500" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasons / Episodes sidebar for TV Series */}
      {movie.contentType === "series" && movie.seasons && movie.seasons.length > 0 && (
        <div
          className="w-full landscape:w-80 md:w-80 shrink-0 border-t landscape:border-t-0 landscape:border-l md:border-t-0 md:border-l border-zinc-900 bg-zinc-950/95 flex flex-col h-1/3 landscape:h-full md:h-full z-10 text-white select-none relative"
          id="episodes-sidebar"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-900 bg-black/40">
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-zinc-400 mb-2">
              {t.seasonsAndEpisodes || "Seasons & Episodes"}
            </h3>
            {/* Season dropdown selector */}
            <select
              value={activeSeason?.id}
              onChange={(e) => {
                const season = movie.seasons?.find((s) => s.id === e.target.value);
                if (season) {
                  setActiveSeason(season);
                  if (season.episodes.length > 0) {
                    setActiveEpisode(season.episodes[0]);
                    setCurrentTime(0);
                  }
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold rounded-md px-3 py-2 text-white focus:outline-hidden focus:border-red-500"
            >
              {movie.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.episodes.length} {t.episodesTab || "Episodes"})
                </option>
              ))}
            </select>
          </div>

          {/* Episode List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
            {activeSeason?.episodes.map((ep) => {
              const isCurrent = activeEpisode?.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    setActiveEpisode(ep);
                    setCurrentTime(0);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 cursor-pointer ${
                    isCurrent
                      ? "bg-red-600/10 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
                      : "bg-zinc-900/40 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-500">
                      {t.episodeLabel || "EPISODE"} {ep.episodeNumber}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {ep.duration}m
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold transition-colors ${isCurrent ? "text-red-400" : "text-white"}`}>
                    {ep.title}
                  </h4>
                  {ep.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-normal mt-0.5">
                      {ep.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
