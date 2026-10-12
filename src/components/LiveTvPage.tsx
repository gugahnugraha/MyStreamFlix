/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Tv, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Search, Globe, Check, RefreshCw, AlertCircle,
  SlidersHorizontal, X, SkipBack, SkipForward
} from "lucide-react";
import Hls from "hls.js";
import * as dashjs from "dashjs";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Movie } from "../types";
import { getProxiedStreamUrl, describeQualityLabel, shortQualityHint, getAlternativeStreamUrls } from "../lib/stream-utils";
import { isNativeCapacitor, enterImmersiveMode, exitImmersiveMode, addImmersiveStateListener } from "../lib/native-fullscreen";

interface LiveTvPageProps {
  channels: Movie[];
  onSelectMovie?: (movie: Movie) => void;
  t: any;
  brandColor?: string;
}

export default function LiveTvPage({
  channels,
  onSelectMovie,
  t,
  brandColor = "#00ADB5"
}: LiveTvPageProps) {
  const liveChannels = channels.filter(c => c.contentType === "livetv" || c.id.startsWith("tv-"));
  const isNativeApp = isNativeCapacitor();

  const [activeChannel, setActiveChannel] = useState<Movie>(liveChannels[0] || channels[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Video playback
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerShellRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<any>(null);
  const startupTimeoutRef = useRef<number | null>(null);
  const bufferTimeoutRef = useRef<number | null>(null);
  const controlsTimerRef = useRef<number | null>(null);

  // Alternative fallback stream URLs (Dihitung langsung secara sinkron agar tidak ada delay/stale channel)
  const candidateUrls = useMemo(() => {
    if (!activeChannel) return [];
    const alts = getAlternativeStreamUrls(activeChannel);
    const primary = activeChannel.videoUrl;
    return [primary, ...alts].filter(Boolean);
  }, [activeChannel?.id, activeChannel?.videoUrl]);

  const [altIndex, setAltIndex] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [needUserGesture, setNeedUserGesture] = useState<boolean>(false);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showFullscreenPlaylist, setShowFullscreenPlaylist] = useState<boolean>(true);
  const [fullscreenCategory, setFullscreenCategory] = useState<string>("All");
  const [fullscreenRegion, setFullscreenRegion] = useState<string>("All");
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);
  const lastTouchTimeRef = useRef<number>(0);

  // Landscape detection (for safe-area insets)
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== "undefined" && window.innerWidth > window.innerHeight
  );

  // Quality selector
  const [qualityLevels, setQualityLevels] = useState<{index: number; height: number; bitrate: number; label: string}[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  // Sync active channel when list changes
  useEffect(() => {
    if (liveChannels.length > 0 && !liveChannels.find(c => c.id === activeChannel?.id)) {
      setActiveChannel(liveChannels[0]);
    }
  }, [channels]);

  // Landscape listener
  useEffect(() => {
    const handle = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("orientationchange", handle);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("orientationchange", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  // Auto-hide HUD & Playlist — 4.5s timer
  const scheduleControlsHide = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (!showQualityMenu) setShowControls(false);
    }, 4500) as unknown as number;
  };

  const revealControls = () => {
    setShowControls(true);
    scheduleControlsHide();
  };

  const toggleControls = (e?: MouseEvent | TouchEvent) => {
    if (e && e.target) {
      const target = e.target as HTMLElement;
      // Jangan sembunyikan jika yang disentuh/diklik adalah tombol kontrol, slider, popover, atau elemen di dock
      if (target.closest("button, input, a, select, .player-menu-popover, .player-interactive")) {
        scheduleControlsHide();
        return;
      }
    }

    setShowControls(prev => {
      const next = !prev;
      if (next) {
        scheduleControlsHide();
      } else {
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      }
      return next;
    });
  };

  // Attach touch/click listeners to player shell for auto show/hide controls & fullscreen playlist
  useEffect(() => {
    const el = playerShellRef.current;
    if (!el) return;
    const handleTouch = (e: TouchEvent) => {
      lastTouchTimeRef.current = Date.now();
      toggleControls(e);
    };
    const handleClick = (e: MouseEvent) => {
      // Cegah click synthetic setelah touchstart pada mobile touchscreen
      if (Date.now() - lastTouchTimeRef.current < 450) return;
      toggleControls(e);
    };
    el.addEventListener("touchstart", handleTouch, { passive: true });
    el.addEventListener("click", handleClick);
    scheduleControlsHide();
    return () => {
      el.removeEventListener("touchstart", handleTouch);
      el.removeEventListener("click", handleClick);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, showQualityMenu]);

  // Auto scroll ke channel aktif di fullscreen playlist dock
  useEffect(() => {
    if (isFullscreen && showControls && showFullscreenPlaylist && fullscreenScrollRef.current) {
      const activeEl = fullscreenScrollRef.current.querySelector<HTMLElement>('[data-active-channel="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [isFullscreen, activeChannel?.id, showControls, showFullscreenPlaylist]);

  // Close quality menu on outside click
  useEffect(() => {
    if (!showQualityMenu) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest?.(".player-menu-popover") && !target.closest?.(".player-menu-btn")) {
        setShowQualityMenu(false);
      }
    };
    window.addEventListener("mousedown", handle, true);
    window.addEventListener("touchstart", handle, true);
    return () => {
      window.removeEventListener("mousedown", handle, true);
      window.removeEventListener("touchstart", handle, true);
    };
  }, [showQualityMenu]);

  // Sync fullscreen state
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    let removeNativeListener = () => {};
    if (isNativeCapacitor()) {
      addImmersiveStateListener((data) => {
        setIsFullscreen(!!data.isFullscreen);
      }).then((unsub) => { removeNativeListener = unsub; });
    }
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      removeNativeListener();
    };
  }, []);

  // Channel switch handler: immediately halts current stream and resets alternative server index
  const handleSelectChannel = (channel: Movie) => {
    if (activeChannel?.id === channel.id) return;
    stopStream();
    setAltIndex(0);
    setActiveChannel(channel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Prev & Next channel navigation
  const handlePrevChannel = () => {
    const list = filteredChannels.length > 0 ? filteredChannels : liveChannels;
    if (list.length === 0) return;
    const currentIndex = list.findIndex(c => c.id === activeChannel?.id);
    const prevIndex = currentIndex <= 0 ? list.length - 1 : currentIndex - 1;
    handleSelectChannel(list[prevIndex]);
    scheduleControlsHide();
  };

  const handleNextChannel = () => {
    const list = filteredChannels.length > 0 ? filteredChannels : liveChannels;
    if (list.length === 0) return;
    const currentIndex = list.findIndex(c => c.id === activeChannel?.id);
    const nextIndex = currentIndex === -1 || currentIndex >= list.length - 1 ? 0 : currentIndex + 1;
    handleSelectChannel(list[nextIndex]);
    scheduleControlsHide();
  };

  const getCountryFlag = (country?: string) => {
    switch (country) {
      case "Indonesia": return "🇮🇩";
      case "China": return "🇨🇳";
      case "Qatar": return "🇶🇦";
      case "France": return "🇫🇷";
      case "Germany": return "🇩🇪";
      case "Austria": return "🇦🇹";
      case "United States": return "🇺🇸";
      case "United Kingdom": return "🇬🇧";
      case "Japan": return "🇯🇵";
      case "South Korea": return "🇰🇷";
      default: return "🌐";
    }
  };

  const clearStreamTimers = () => {
    if (startupTimeoutRef.current) { clearTimeout(startupTimeoutRef.current); startupTimeoutRef.current = null; }
    if (bufferTimeoutRef.current) { clearTimeout(bufferTimeoutRef.current); bufferTimeoutRef.current = null; }
  };

  const stopStream = () => {
    clearStreamTimers();
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (dashRef.current) {
      try { dashRef.current.reset(); } catch {}
      dashRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try { video.pause(); } catch {}
      video.removeAttribute("src");
      video.load();
    }
  };

  const engageError = () => {
    setIsBuffering(false);
    setStreamError(true);
    setIsPlaying(false);
    setNeedUserGesture(false);
    stopStream();
  };

  const tryNextAlternative = () => {
    if (altIndex + 1 < candidateUrls.length) {
      console.warn(`[LiveTV] Stream failed on server ${altIndex + 1}. Auto-switching to server ${altIndex + 2}/${candidateUrls.length}`);
      setAltIndex(prev => prev + 1);
    } else {
      engageError();
    }
  };

  const scheduleStartupTimeout = () => {
    clearStreamTimers();
    startupTimeoutRef.current = window.setTimeout(() => tryNextAlternative(), 14000) as unknown as number;
  };

  const scheduleBufferTimeout = () => {
    if (bufferTimeoutRef.current) return;
    bufferTimeoutRef.current = window.setTimeout(() => tryNextAlternative(), 22000) as unknown as number;
  };

  // Stream loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeChannel?.videoUrl) return;

    stopStream();
    setIsBuffering(true);
    setStreamError(false);
    setNeedUserGesture(false);
    setQualityLevels([]);
    setSelectedQuality("Auto");
    setShowQualityMenu(false);

    const activeRawUrl = candidateUrls[altIndex] || activeChannel.videoUrl;
    const streamUrl = getProxiedStreamUrl(activeRawUrl);
    scheduleStartupTimeout();

    const attemptPlay = () => {
      video.volume = volume;
      video.muted = false;
      video.play()
        .then(() => { setIsPlaying(true); setNeedUserGesture(false); setIsMuted(false); })
        .catch(() => {
          // Autoplay blocked — retry muted
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => { setIsPlaying(true); setNeedUserGesture(false); })
            .catch(() => { setIsPlaying(false); setNeedUserGesture(true); });
        });
    };

    // 1. MPEG-DASH (.mpd) stream playback via dash.js
    if (streamUrl.includes(".mpd")) {
      video.removeAttribute("src");
      try {
        const dashPlayer = dashjs.MediaPlayer().create();
        dashRef.current = dashPlayer;
        dashPlayer.initialize(video, streamUrl, true);
        dashPlayer.updateSettings({
          streaming: {
            cmcd: { enabled: false },
            text: { defaultEnabled: false },
            buffer: { fastSwitchEnabled: true },
            delay: { liveDelay: 3 },
          },
        });

        dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
          setIsBuffering(false);
          clearStreamTimers();
          try {
            const playerAny = dashPlayer as any;
            const bitrates = (typeof playerAny.getBitrateInfoListFor === "function" ? playerAny.getBitrateInfoListFor("video") : playerAny.getBitratesForWithInfo?.("video")) || [];
            if (bitrates.length > 0) {
              const lvls = bitrates.map((b: any, idx: number) => {
                const height = b.height || 0;
                const bitrate = b.bitrate || 0;
                const label = describeQualityLabel(height, bitrate) || (height ? `${height}p` : `Level ${idx + 1}`);
                return { index: idx, height, bitrate, label };
              });
              setQualityLevels(lvls);
            }
          } catch (err) {
            console.warn("Could not extract DASH bitrate list:", err);
          }
          attemptPlay();
        });

        dashPlayer.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e: any) => {
          if (e.mediaType === "video") {
            const playerAny = dashPlayer as any;
            const bitrates = (typeof playerAny.getBitrateInfoListFor === "function" ? playerAny.getBitrateInfoListFor("video") : playerAny.getBitratesForWithInfo?.("video")) || [];
            const b = bitrates[e.newQuality];
            if (b && (!selectedQuality || selectedQuality.startsWith("Auto"))) {
              const hint = shortQualityHint(b.height || 0, b.bitrate || 0);
              setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
            }
          }
        });

        dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
          console.warn("LiveTV DASH playback error:", e);
          tryNextAlternative();
        });
      } catch (e) {
        console.error("Failed to initialize dashjs in LiveTV:", e);
        tryNextAlternative();
      }
    } else if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      // 2. HLS (.m3u8) stream playback via hls.js
      video.removeAttribute("src");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 12000,
        levelLoadingTimeOut: 12000,
        fragLoadingTimeOut: 12000,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setIsBuffering(false);
        clearStreamTimers();
        const levels = (data.levels || []).map((lv, idx) => ({
          index: idx,
          height: lv.height || 0,
          bitrate: lv.bitrate || 0,
          label: describeQualityLabel(lv.height || 0, lv.bitrate || 0) || `Level ${idx + 1}`,
        }));
        setQualityLevels(levels);
        attemptPlay();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        const lv = (hlsRef.current?.levels || [])[data.level];
        if (lv && hlsRef.current?.currentLevel === -1) {
          const hint = shortQualityHint(lv.height || 0, lv.bitrate || 0);
          setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
        }
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          console.warn("HLS network error, trying alternative server...");
          tryNextAlternative();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
          return;
        }
        tryNextAlternative();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL")) {
      // 3. Native Apple HLS (Safari / iOS)
      video.src = streamUrl;
      video.load();
      attemptPlay();
    } else {
      // 4. Fallback direct playback
      video.src = streamUrl;
      video.load();
      attemptPlay();
    }

    return () => {
      clearStreamTimers();
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (dashRef.current) {
        try { dashRef.current.reset(); } catch {}
        dashRef.current = null;
      }
    };
  }, [activeChannel?.id, activeChannel?.videoUrl, altIndex, reloadSeq]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => { setIsPlaying(true); setNeedUserGesture(false); })
        .catch(() => setNeedUserGesture(true));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    if (!next && video.volume === 0) { video.volume = 0.8; setVolume(0.8); }
    setIsMuted(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = async () => {
    const targetFs = !isFullscreen;
    setIsFullscreen(targetFs);

    if (isNativeApp) {
      try {
        if (targetFs) {
          await ScreenOrientation.lock({ orientation: "landscape" });
          await enterImmersiveMode();
        } else {
          await exitImmersiveMode();
          await ScreenOrientation.unlock();
        }
      } catch {}
      return;
    }

    // Browser: requestFullscreen FIRST, then lock orientation inside the
    // fullscreenchange event so the lock request happens from within fullscreen
    // context — required by the Screen Orientation API spec.
    const target = playerShellRef.current;
    if (!target) return;

    if (targetFs) {
      try {
        await target.requestFullscreen();
        // Now we are in fullscreen — lock orientation
        try {
          await (screen.orientation as any).lock("landscape");
        } catch {
          // Screen Orientation lock not supported (iOS Safari, etc.) — ignore
        }
      } catch {
        // requestFullscreen rejected — revert state
        setIsFullscreen(false);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch {}
      try {
        (screen.orientation as any).unlock?.();
      } catch {}
    }
  };

  const handleQualitySelect = (mode: "auto" | number) => {
    const hls = hlsRef.current;
    const dash = dashRef.current;
    if (!hls && !dash) { setShowQualityMenu(false); return; }

    if (mode === "auto") {
      if (hls) {
        hls.currentLevel = -1;
        hls.loadLevel = -1;
        hls.nextLevel = -1;
        const lv = hls.levels[hls.autoLevelCapping];
        const hint = lv ? shortQualityHint(lv.height || 0, lv.bitrate || 0) : "";
        setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
      } else if (dash) {
        try {
          dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
        } catch {}
        setSelectedQuality("Auto");
      }
    } else if (typeof mode === "number") {
      if (hls) {
        hls.currentLevel = mode;
        hls.loadLevel = mode;
        hls.nextLevel = mode;
        const lv = hls.levels[mode];
        const label = lv ? (describeQualityLabel(lv.height || 0, lv.bitrate || 0) || `Level ${mode + 1}`) : `Level ${mode + 1}`;
        setSelectedQuality(label);
      } else if (dash) {
        try {
          dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
          dash.setQualityFor("video", mode);
          const dashAny = dash as any;
          const bitrates = (typeof dashAny.getBitrateInfoListFor === "function" ? dashAny.getBitrateInfoListFor("video") : dashAny.getBitratesForWithInfo?.("video")) || [];
          const b = bitrates[mode];
          const label = b ? (describeQualityLabel(b.height || 0, b.bitrate || 0) || (b.height ? `${b.height}p` : `Level ${mode + 1}`)) : `Level ${mode + 1}`;
          setSelectedQuality(label);
        } catch {}
      }
    }
    setShowQualityMenu(false);
  };

  // HUD safe-area padding.
  // Key insight: the HUD bar sits at absolute bottom-0 of the player element.
  // In non-fullscreen embedded mode (both APK and mobile web), the player is
  // a normal aspect-ratio box inside the page — no system UI overlaps it —
  // so paddingBottom should be small (just breathing room, ~8px).
  // In fullscreen mode the player covers the whole screen, so we need
  // env(safe-area-inset-bottom) to clear the home indicator / nav bar.
  const hudStyle: React.CSSProperties = isFullscreen
    ? {
        // Fullscreen: safe-area insets + extra breathing room
        paddingBottom: isNativeApp
          ? (isLandscape ? "calc(env(safe-area-inset-bottom, 0px) + 20px)" : "calc(env(safe-area-inset-bottom, 0px) + 24px)")
          : "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        paddingLeft: "calc(env(safe-area-inset-left, 0px) + 8px)",
        paddingRight: "calc(env(safe-area-inset-right, 0px) + 8px)",
      }
    : {
        // Non-fullscreen embedded: just a small internal gutter
        paddingBottom: "8px",
      };

  const categories = ["All", "News", "Documentary", "Sports", "Entertainment", "Kids", "Science", "Business", "Culture", "Local ID"];
  const regions = ["All", "Indonesia", "China", "Asia", "Europe", "Americas", "Middle East"];

  const filteredChannels = liveChannels.filter(ch => {
    const q = searchQuery.toLowerCase();
    if (q && !ch.title.toLowerCase().includes(q) && !ch.description.toLowerCase().includes(q) && !(ch.country || "").toLowerCase().includes(q)) return false;

    if (selectedCategory !== "All") {
      if (selectedCategory === "Local ID") {
        if (!(ch.country === "Indonesia" || ch.id.startsWith("tv-") || ch.genres.some(g => ["Local ID", "Indonesia", "Nasional"].includes(g)))) return false;
      } else if (selectedCategory === "News") {
        if (!ch.genres.some(g => ["News", "Business", "Finance", "Berita", "Informasi"].includes(g))) return false;
      } else if (selectedCategory === "Documentary") {
        if (!ch.genres.some(g => ["Documentary", "Dokumenter"].includes(g))) return false;
      } else if (selectedCategory === "Entertainment") {
        if (!ch.genres.some(g => ["Entertainment", "Comedy", "Music", "Hiburan", "Variety"].includes(g))) return false;
      } else if (selectedCategory === "Sports") {
        if (!ch.genres.some(g => ["Sports", "Olahraga", "Soccer"].includes(g))) return false;
      } else if (selectedCategory === "Kids") {
        if (!ch.genres.some(g => ["Kids", "Animation", "Anak", "Family"].includes(g))) return false;
      } else if (selectedCategory === "Science") {
        if (!ch.genres.some(g => ["Science", "Education", "Sains"].includes(g))) return false;
      } else if (selectedCategory === "Business") {
        if (!ch.genres.some(g => ["Business", "Finance", "Bisnis"].includes(g))) return false;
      } else if (selectedCategory === "Culture") {
        if (!ch.genres.some(g => ["Culture", "Budaya", "Religious", "Agama"].includes(g))) return false;
      }
    }

    if (selectedRegion !== "All") {
      const country = ch.country || "";
      if (selectedRegion === "Indonesia" && country !== "Indonesia" && !ch.id.startsWith("tv-")) return false;
      if (selectedRegion === "China" && country !== "China") return false;
      if (selectedRegion === "Asia" && !["Japan", "South Korea", "China", "Singapore", "Turkey", "Qatar", "Pakistan", "Indonesia"].includes(country)) return false;
      if (selectedRegion === "Europe" && !["Germany", "France", "United Kingdom", "Russia", "Austria"].includes(country)) return false;
      if (selectedRegion === "Americas" && !["United States", "Canada", "Brazil"].includes(country)) return false;
      if (selectedRegion === "Middle East" && !["Qatar", "Turkey", "Saudi Arabia", "UAE"].includes(country)) return false;
    }

    return true;
  });

  const dockChannels = useMemo(() => {
    return liveChannels.filter(ch => {
      if (fullscreenCategory !== "All") {
        if (fullscreenCategory === "Local ID") {
          if (!(ch.country === "Indonesia" || ch.id.startsWith("tv-") || ch.genres.some(g => ["Local ID", "Indonesia", "Nasional"].includes(g)))) return false;
        } else if (fullscreenCategory === "News") {
          if (!ch.genres.some(g => ["News", "Business", "Finance", "Berita", "Informasi"].includes(g))) return false;
        } else if (fullscreenCategory === "Documentary") {
          if (!ch.genres.some(g => ["Documentary", "Dokumenter"].includes(g))) return false;
        } else if (fullscreenCategory === "Entertainment") {
          if (!ch.genres.some(g => ["Entertainment", "Comedy", "Music", "Hiburan", "Variety"].includes(g))) return false;
        } else if (fullscreenCategory === "Sports") {
          if (!ch.genres.some(g => ["Sports", "Olahraga", "Soccer"].includes(g))) return false;
        } else if (fullscreenCategory === "Kids") {
          if (!ch.genres.some(g => ["Kids", "Animation", "Anak", "Family"].includes(g))) return false;
        } else if (fullscreenCategory === "Science") {
          if (!ch.genres.some(g => ["Science", "Education", "Sains"].includes(g))) return false;
        } else if (fullscreenCategory === "Business") {
          if (!ch.genres.some(g => ["Business", "Finance", "Bisnis"].includes(g))) return false;
        } else if (fullscreenCategory === "Culture") {
          if (!ch.genres.some(g => ["Culture", "Budaya", "Religious", "Agama"].includes(g))) return false;
        }
      }

      if (fullscreenRegion !== "All") {
        const country = ch.country || "";
        if (fullscreenRegion === "Indonesia" && country !== "Indonesia" && !ch.id.startsWith("tv-")) return false;
        if (fullscreenRegion === "China" && country !== "China") return false;
        if (fullscreenRegion === "Asia" && !["Japan", "South Korea", "China", "Singapore", "Turkey", "Qatar", "Pakistan", "Indonesia"].includes(country)) return false;
        if (fullscreenRegion === "Europe" && !["Germany", "France", "United Kingdom", "Russia", "Austria"].includes(country)) return false;
        if (fullscreenRegion === "Americas" && !["United States", "Canada", "Brazil"].includes(country)) return false;
        if (fullscreenRegion === "Middle East" && !["Qatar", "Turkey", "Saudi Arabia", "UAE"].includes(country)) return false;
      }

      return true;
    });
  }, [liveChannels, fullscreenCategory, fullscreenRegion]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 sm:pb-20 pt-2 sm:pt-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-3 sm:space-y-5">

      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
              {t?.liveTvTitle || "Live TV"}
              <span className="ml-2 text-[10px] font-bold text-red-500 uppercase tracking-widest align-middle">
                {t?.liveTvCenter || "FREE-TO-AIR"}
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500 hidden sm:block">
              {t?.liveTvSubTitle || "24/7 free live streams worldwide"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t?.searchTvPlaceholder || "Search channels..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>
      </div>

      {/* Main Grid: Player (2/3) + Channel List (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

        {/* Player */}
        <div className="lg:col-span-2">
          <div
            ref={playerShellRef}
            className={`bg-black overflow-hidden shadow-2xl border border-white/10 transition-all ${
              isFullscreen && isNativeApp
                ? "fixed inset-0 z-50 rounded-none border-0 w-full h-full"
                : "relative aspect-video rounded-xl sm:rounded-2xl fullscreen:rounded-none fullscreen:border-0"
            }`}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              onWaiting={() => { setIsBuffering(true); scheduleBufferTimeout(); }}
              onPlaying={() => { setIsBuffering(false); setStreamError(false); clearStreamTimers(); }}
              onCanPlay={() => { setIsBuffering(false); clearStreamTimers(); }}
              onError={() => {
                // Non-HLS: try muted before error state
                const video = videoRef.current;
                if (video && !video.muted) {
                  video.muted = true;
                  setIsMuted(true);
                  video.load();
                  video.play()
                    .then(() => { setIsBuffering(false); setStreamError(false); clearStreamTimers(); })
                    .catch(() => { setIsBuffering(false); setStreamError(true); clearStreamTimers(); });
                  return;
                }
                setIsBuffering(false);
                setStreamError(true);
                clearStreamTimers();
              }}
            />

            {/* NOW STREAMING badge — minimalis, style MediaPlayer */}
            <div
              className={`absolute left-3 z-20 pointer-events-none transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
              style={{
                top: isFullscreen
                  ? "calc(env(safe-area-inset-top, 0px) + 20px)"
                  : "8px",
              }}
            >
              <p className="text-[9px] sm:text-[10px] font-bold text-red-500 font-mono tracking-wider uppercase leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {t?.nowStreaming || "NOW STREAMING"} • {activeChannel?.quality || "Full HD"}
              </p>
              <h2 className="text-white text-xs sm:text-sm font-extrabold truncate max-w-[200px] sm:max-w-xs mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {activeChannel?.title || "Live TV"}
              </h2>
            </div>

            {/* Tap-to-play overlay (autoplay blocked) */}
            {needUserGesture && !streamError && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-4 text-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-8 h-8 ml-1 fill-white" />
                </button>
                <p className="text-xs text-zinc-300 max-w-xs">
                  {t?.tapToPlay || "Tap to start live stream"}
                </p>
              </div>
            )}

            {/* Buffering */}
            {isBuffering && !streamError && !needUserGesture && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">{t?.connectingLive || "Connecting..."}</span>
              </div>
            )}

            {/* Stream error */}
            {streamError && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center z-30 gap-3 px-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t?.signalLost || "Signal Lost"}</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    {t?.signalLostDesc || "Channel offline or stream unavailable."}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => { setStreamError(false); setIsBuffering(true); setReloadSeq(s => s + 1); }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t?.reconnectBtn || "Retry"}
                  </button>
                </div>
              </div>
            )}

            {/* HUD Control Bar — always visible on mobile, auto-hides on desktop */}
            <div
              className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-center justify-between gap-2 px-3 sm:px-4 pt-8 transition-opacity duration-300 z-20 player-interactive ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={hudStyle}
            >
              {/* Left: Prev + Play/Pause + Next + Volume */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Prev Channel Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevChannel(); }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Channel Sebelumnya"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                {/* Next Channel Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextChannel(); }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Channel Berikutnya"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Rich Visual Volume Bar (Bekas lewatan & thumb) */}
                <div
                  className="hidden sm:flex relative items-center h-6 w-20 md:w-24 group cursor-pointer select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Background Track (Abu-abu transparan untuk progress di depannya) */}
                  <div className="w-full h-1.5 group-hover:h-2 bg-white/20 group-hover:bg-white/25 rounded-full overflow-hidden relative transition-all duration-150">
                    {/* Fill Volume Track (Progress volume terisi - Biru tema) */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-sky-600 to-cyan-400 rounded-full pointer-events-none shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                      style={{
                        width: `${(isMuted ? 0 : volume) * 100}%`,
                        background: brandColor && brandColor !== "#34C759" ? brandColor : "linear-gradient(90deg, #0284C7, #38BDF8)"
                      }}
                    />
                  </div>

                  {/* Volume Thumb Knob Bulat Putih dengan Bingkai Biru Tema */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 bg-white border-2 border-sky-400 rounded-full shadow-md scale-75 group-hover:scale-110 transition-transform duration-150 pointer-events-none z-10"
                    style={{
                      left: `${(isMuted ? 0 : volume) * 100}%`,
                      borderColor: brandColor && brandColor !== "#34C759" ? brandColor : "#38BDF8"
                    }}
                  />

                  {/* Transparent Native Slider */}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
                    title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  />
                </div>
              </div>

              {/* Right: Quality + Playlist + Fullscreen */}
              <div className="relative flex items-center gap-2">
                {qualityLevels.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowQualityMenu(v => !v); }}
                      className="player-menu-btn px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer min-h-11"
                      title={t?.videoQuality || "Quality"}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: brandColor }} />
                      <span className="hidden sm:inline whitespace-nowrap">{selectedQuality}</span>
                    </button>

                    {showQualityMenu && (
                      <div className="player-menu-popover absolute bottom-14 right-0 z-40 w-52 rounded-xl bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest font-mono" style={{ color: brandColor }}>
                            {t?.videoQuality || "Video Quality"}
                          </p>
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                          <button
                            onClick={() => handleQualitySelect("auto")}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold hover:bg-white/10 cursor-pointer text-white transition-all"
                            style={selectedQuality.startsWith("Auto") ? { backgroundColor: `${brandColor}25`, color: brandColor } : undefined}
                          >
                            <span>Auto</span>
                            {selectedQuality.startsWith("Auto") && <Check className="w-3.5 h-3.5" style={{ color: brandColor }} />}
                          </button>
                          {qualityLevels
                            .slice()
                            .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
                            .map(lv => {
                              const active = !selectedQuality.startsWith("Auto") && selectedQuality === lv.label;
                              return (
                                <button
                                  key={lv.index}
                                  onClick={() => handleQualitySelect(lv.index)}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium hover:bg-white/10 cursor-pointer text-zinc-200 transition-all"
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

                {isFullscreen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullscreenPlaylist(prev => !prev);
                      scheduleControlsHide();
                    }}
                    className={`h-11 px-3.5 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      showFullscreenPlaylist
                        ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/40"
                        : "bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/10"
                    }`}
                    title={showFullscreenPlaylist ? "Sembunyikan Playlist" : "Tampilkan Playlist"}
                  >
                    <Tv className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline">Playlist</span>
                  </button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5 text-red-400" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Fullscreen Interactive Channel Playlist Floating Dock Overlay */}
            {isFullscreen && (
              <div
                className={`absolute inset-x-0 z-25 flex flex-col items-center px-3 sm:px-6 transition-all duration-300 pointer-events-none ${
                  showControls && showFullscreenPlaylist
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6 pointer-events-none"
                }`}
                style={{
                  paddingLeft: "calc(env(safe-area-inset-left, 0px) + 12px)",
                  paddingRight: "calc(env(safe-area-inset-right, 0px) + 12px)",
                  bottom: isNativeApp
                    ? (isLandscape ? "calc(env(safe-area-inset-bottom, 0px) + 84px)" : "calc(env(safe-area-inset-bottom, 0px) + 88px)")
                    : "calc(env(safe-area-inset-bottom, 0px) + 84px)",
                }}
              >
                <div className="w-full max-w-5xl rounded-2xl bg-zinc-950/85 backdrop-blur-2xl border border-white/15 p-2 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] pointer-events-auto player-interactive flex flex-col gap-2">
                  {/* Dock Header */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                        <span>LIVE PLAYLIST</span>
                      </div>
                      <span className="text-xs font-semibold text-white truncate hidden md:inline">
                        {activeChannel?.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                        ({dockChannels.length} channel)
                      </span>
                    </div>

                    {/* Dock Filters: Categories & Regions */}
                    <div className="flex flex-col gap-1 max-w-[65%] sm:max-w-[72%]">
                      {/* Categories Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {categories.map(cat => {
                          const isCatActive = fullscreenCategory.toLowerCase() === cat.toLowerCase();
                          return (
                            <button
                              key={cat}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenCategory(cat);
                                scheduleControlsHide();
                              }}
                              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                                isCatActive
                                  ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                                  : "bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              {t?.[cat] || cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* Region/Country Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {regions.map(reg => {
                          const isRegActive = fullscreenRegion.toLowerCase() === reg.toLowerCase();
                          return (
                            <button
                              key={reg}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenRegion(reg);
                                scheduleControlsHide();
                              }}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                                isRegActive
                                  ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]"
                                  : "bg-white/5 text-zinc-400 hover:bg-white/15 hover:text-zinc-200"
                              }`}
                            >
                              <span>{getCountryFlag(reg !== "All" && reg !== "Europe" && reg !== "Asia" && reg !== "Americas" && reg !== "Middle East" ? reg : undefined)}</span>
                              <span>{t?.[reg] || reg}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Close / Hide Dock Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullscreenPlaylist(false);
                      }}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Sembunyikan Playlist"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Horizontal Channel Scroll Rail */}
                  <div
                    ref={fullscreenScrollRef}
                    className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 scroll-smooth"
                  >
                    {dockChannels.map(channel => {
                      const isActive = activeChannel?.id === channel.id;
                      return (
                        <button
                          key={channel.id}
                          data-active-channel={isActive ? "true" : "false"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectChannel(channel);
                            scheduleControlsHide();
                          }}
                          className={`shrink-0 w-40 sm:w-48 p-2 rounded-xl border text-left transition-all duration-200 flex items-center gap-2.5 cursor-pointer group ${
                            isActive
                              ? "bg-blue-950/80 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-1 ring-blue-500 scale-[1.02]"
                              : "bg-zinc-900/85 hover:bg-zinc-800/90 border-white/10 hover:border-white/25 hover:scale-[1.01]"
                          }`}
                        >
                          {/* Logo / Thumbnail */}
                          <div className="w-9 h-9 rounded-lg bg-zinc-950/90 border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden relative">
                            <img
                              src={channel.posterUrl}
                              alt={channel.title}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                            {isActive && (
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-zinc-950" />
                            )}
                          </div>

                          {/* Title & Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate leading-tight ${isActive ? "text-blue-300" : "text-white group-hover:text-blue-200"}`}>
                              {channel.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-zinc-300 font-medium shrink-0 flex items-center gap-0.5">
                                <span>{getCountryFlag(channel.country)}</span>
                                <span className="truncate max-w-[50px]">{channel.country || "Live"}</span>
                              </span>
                              <span className="text-[8px] text-zinc-500">•</span>
                              <span className="text-[9px] text-zinc-400 truncate">
                                {channel.genres?.[0] || channel.category || "TV"}
                              </span>
                              {isActive && (
                                <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/20 px-1 rounded ml-auto shrink-0">
                                  ON AIR
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Channel detail card intentionally removed — info visible in channel list */}
        </div>

        {/* Channel List */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3 backdrop-blur-md">

          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {t?.channelList || "Channels"} <span className="text-zinc-500 font-normal">({filteredChannels.length})</span>
              </span>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {t?.[cat] || cat}
              </button>
            ))}
          </div>

          {/* Region filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <Globe className="w-3 h-3 text-zinc-600 shrink-0" />
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedRegion === region
                    ? "bg-blue-600/80 text-white border-blue-500/60"
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300"
                }`}
              >
                {t?.[region] || region}
              </button>
            ))}
          </div>

          {/* Scrollable channel list */}
          <div className="space-y-1 max-h-[50vh] sm:max-h-[55vh] lg:max-h-[calc(100vh-18rem)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredChannels.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                {t?.noMatchingTv || "No channels found"}
              </div>
            ) : (
              filteredChannels.map(channel => {
                const isActive = activeChannel?.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                      isActive
                        ? "bg-red-950/40 border-red-500/50 shadow-sm"
                        : "bg-zinc-900/80 hover:bg-zinc-800 border-white/5 hover:border-white/15"
                    }`}
                  >
                    {/* Logo */}
                    <div className="w-8 h-8 rounded-md bg-zinc-950 border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={channel.posterUrl} alt={channel.title} className="w-full h-full object-contain" />
                    </div>

                    {/* Name + country & genre */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? "text-red-400" : "text-white"}`}>
                        {channel.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-300 font-medium shrink-0 flex items-center gap-0.5">
                          <span>{getCountryFlag(channel.country)}</span>
                          <span>{channel.country || "Global"}</span>
                        </span>
                        <span className="text-[9px] text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500 truncate">
                          {channel.genres.slice(0, 2).join(", ") || "TV"}
                        </span>
                      </div>
                    </div>

                    {/* Playing indicator */}
                    {isActive ? (
                      <span className="shrink-0 flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        ON
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/5 hover:bg-red-600 text-zinc-500 hover:text-white flex items-center justify-center shrink-0 transition-all">
                        <Play className="w-3 h-3 ml-0.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
