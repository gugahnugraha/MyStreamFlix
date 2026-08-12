/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Tv, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Search, Globe, Check, RefreshCw, AlertCircle,
  SlidersHorizontal
} from "lucide-react";
import Hls from "hls.js";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Movie } from "../types";
import { getProxiedStreamUrl, describeQualityLabel, shortQualityHint } from "../lib/stream-utils";
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
  const startupTimeoutRef = useRef<number | null>(null);
  const bufferTimeoutRef = useRef<number | null>(null);
  const controlsTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [needUserGesture, setNeedUserGesture] = useState<boolean>(false);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

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

  // Auto-hide HUD — 4.5s, mirrors MediaPlayer behaviour
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

  // Attach touch/click listeners to player shell for controls visibility
  useEffect(() => {
    const el = playerShellRef.current;
    if (!el) return;
    const handleTouch = () => revealControls();
    const handleClick = () => revealControls();
    el.addEventListener("touchstart", handleTouch, { passive: true });
    el.addEventListener("click", handleClick);
    scheduleControlsHide();
    return () => {
      el.removeEventListener("touchstart", handleTouch);
      el.removeEventListener("click", handleClick);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, showQualityMenu]);

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

  const clearStreamTimers = () => {
    if (startupTimeoutRef.current) { clearTimeout(startupTimeoutRef.current); startupTimeoutRef.current = null; }
    if (bufferTimeoutRef.current) { clearTimeout(bufferTimeoutRef.current); bufferTimeoutRef.current = null; }
  };

  const stopStream = () => {
    clearStreamTimers();
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
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

  const scheduleStartupTimeout = () => {
    clearStreamTimers();
    startupTimeoutRef.current = window.setTimeout(() => engageError(), 12000) as unknown as number;
  };

  const scheduleBufferTimeout = () => {
    if (bufferTimeoutRef.current) return;
    bufferTimeoutRef.current = window.setTimeout(() => engageError(), 20000) as unknown as number;
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

    const streamUrl = getProxiedStreamUrl(activeChannel.videoUrl);
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

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
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
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) { hls?.startLoad(); return; }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls?.recoverMediaError(); return; }
        setStreamError(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL")) {
      video.src = streamUrl;
      video.load();
      attemptPlay();
    } else {
      video.src = streamUrl;
      video.load();
      attemptPlay();
    }

    return () => {
      clearStreamTimers();
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [activeChannel, reloadSeq]);

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
    if (!hls) { setShowQualityMenu(false); return; }
    if (mode === "auto") {
      hls.currentLevel = -1;
      const lv = hls.levels[hls.autoLevelCapping];
      const hint = lv ? shortQualityHint(lv.height || 0, lv.bitrate || 0) : "";
      setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
    } else {
      hls.currentLevel = mode;
      const lv = hls.levels[mode];
      setSelectedQuality(lv ? (describeQualityLabel(lv.height || 0, lv.bitrate || 0) || `Level ${mode + 1}`) : "Auto");
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

  const categories = ["All", "News", "Entertainment", "Sports", "Kids", "Science", "Business", "Culture", "Local ID"];
  const regions = ["All", "Indonesia", "Asia", "Europe", "Americas", "Middle East"];

  const filteredChannels = liveChannels.filter(ch => {
    const q = searchQuery.toLowerCase();
    if (q && !ch.title.toLowerCase().includes(q) && !ch.description.toLowerCase().includes(q) && !(ch.country || "").toLowerCase().includes(q)) return false;

    if (selectedCategory !== "All") {
      if (selectedCategory === "Local ID") {
        if (!(ch.country === "Indonesia" || ch.id.startsWith("tv-") || ch.genres.some(g => ["Local ID", "Indonesia", "Nasional"].includes(g)))) return false;
      } else if (selectedCategory === "News") {
        if (!ch.genres.some(g => ["News", "Business", "Finance", "Berita", "Informasi"].includes(g))) return false;
      } else if (selectedCategory === "Entertainment") {
        if (!ch.genres.some(g => ["Entertainment", "Comedy", "Music", "Hiburan", "Variety"].includes(g))) return false;
      } else if (selectedCategory === "Sports") {
        if (!ch.genres.some(g => ["Sports", "Olahraga", "Soccer"].includes(g))) return false;
      } else if (selectedCategory === "Kids") {
        if (!ch.genres.some(g => ["Kids", "Animation", "Anak", "Family"].includes(g))) return false;
      } else if (selectedCategory === "Science") {
        if (!ch.genres.some(g => ["Science", "Education", "Documentary", "Sains"].includes(g))) return false;
      } else if (selectedCategory === "Business") {
        if (!ch.genres.some(g => ["Business", "Finance", "Bisnis"].includes(g))) return false;
      } else if (selectedCategory === "Culture") {
        if (!ch.genres.some(g => ["Culture", "Budaya", "Religious", "Agama", "Documentary"].includes(g))) return false;
      }
    }

    if (selectedRegion !== "All") {
      const country = ch.country || "";
      if (selectedRegion === "Indonesia" && country !== "Indonesia" && !ch.id.startsWith("tv-")) return false;
      if (selectedRegion === "Asia" && !["Japan", "South Korea", "China", "Singapore", "Turkey", "Qatar", "Pakistan", "Indonesia"].includes(country)) return false;
      if (selectedRegion === "Europe" && !["Germany", "France", "United Kingdom", "Russia"].includes(country)) return false;
      if (selectedRegion === "Americas" && !["United States", "Canada", "Brazil"].includes(country)) return false;
      if (selectedRegion === "Middle East" && !["Qatar", "Turkey", "Saudi Arabia", "UAE"].includes(country)) return false;
    }

    return true;
  });

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
              className="absolute left-3 z-20 pointer-events-none"
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
                <button
                  onClick={() => { setStreamError(false); setIsBuffering(true); setReloadSeq(s => s + 1); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t?.reconnectBtn || "Retry"}
                </button>
              </div>
            )}

            {/* HUD Control Bar — always visible on mobile, auto-hides on desktop */}
            <div
              className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-center justify-between gap-2 px-3 sm:px-4 pt-8 transition-opacity duration-300 z-20 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={hudStyle}
            >
              {/* Left: Play/Pause + Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <input
                  type="range"
                  min={0} max={1} step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:block w-20 accent-red-600 bg-zinc-700 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Right: Quality + Fullscreen */}
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

                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5 text-red-400" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
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
                    onClick={() => {
                      setActiveChannel(channel);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
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

                    {/* Name + genre */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? "text-red-400" : "text-white"}`}>
                        {channel.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {channel.genres.slice(0, 2).join(", ") || "TV"}
                      </p>
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
