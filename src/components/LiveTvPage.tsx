import React, { useState, useEffect, useRef } from "react";
import { 
  Tv, Play, Pause, Volume2, VolumeX, Maximize, Minimize, X, Subtitles, Settings, Search, Sparkles, 
  Radio, Info, Globe, Flame, Check, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, Lock, Unlock, SlidersHorizontal, RotateCcw, RotateCw, SkipBack, SkipForward
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
  // Filter channels that are strictly Live TV
  const liveChannels = channels.filter(c => c.contentType === "livetv" || c.id.startsWith("tv-"));

  const isNativeApp = isNativeCapacitor();
  
  // State for active playing channel
  const [activeChannel, setActiveChannel] = useState<Movie>(liveChannels[0] || channels[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Video playback states
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerShellRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const startupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [needUserGesture, setNeedUserGesture] = useState<boolean>(false);
  const [reloadSeq, setReloadSeq] = useState(0);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Video Quality selector states
  const [qualityLevels, setQualityLevels] = useState<{index: number; height: number; bitrate: number; label: string}[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  // Initialize active channel if list changes
  useEffect(() => {
    if (liveChannels.length > 0 && !liveChannels.find(c => c.id === activeChannel?.id)) {
      setActiveChannel(liveChannels[0]);
    }
  }, [channels]);

  // Auto-hide HUD controls after 3s of inactivity (consistent with MediaPlayer)
  useEffect(() => {
    if (!isPlaying || isScreenLocked) return;
    const scheduleHide = () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!(showQualityMenu || showSpeedMenu)) {
          setShowControls(false);
        }
      }, 3200);
    };
    scheduleHide();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isScreenLocked, showQualityMenu, showSpeedMenu]);

  // Close menus on outside click
  useEffect(() => {
    if (!showQualityMenu && !showSpeedMenu) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInside =
        target.closest?.(".player-menu-popover") || target.closest?.(".player-menu-btn");
      if (!isInside) {
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick, true);
    window.addEventListener("touchstart", handleOutsideClick, true);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick, true);
      window.removeEventListener("touchstart", handleOutsideClick, true);
    };
  }, [showQualityMenu, showSpeedMenu]);

  // Sync fullscreen state
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);

    // Native Capacitor immersive fullscreen events (Android APK)
    let removeNativeListener = () => {};
    if (isNativeCapacitor()) {
      addImmersiveStateListener((data) => {
        setIsFullscreen(!!data.isFullscreen);
      }).then((unsub) => {
        removeNativeListener = unsub;
      });
    }

    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      removeNativeListener();
    };
  }, []);

  // Active channel index
  const activeChannelIndex = liveChannels.findIndex(c => c.id === activeChannel?.id);

  const handlePrevChannel = () => {
    if (liveChannels.length <= 1) return;
    const prevIdx = activeChannelIndex > 0 ? activeChannelIndex - 1 : liveChannels.length - 1;
    setActiveChannel(liveChannels[prevIdx]);
  };

  const handleNextChannel = () => {
    if (liveChannels.length <= 1) return;
    const nextIdx = activeChannelIndex < liveChannels.length - 1 ? activeChannelIndex + 1 : 0;
    setActiveChannel(liveChannels[nextIdx]);
  };

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

  const scheduleStartupTimeout = () => {
    clearStreamTimers();
    startupTimeoutRef.current = setTimeout(() => {
      setIsBuffering(false);
      setStreamError(true);
      setIsPlaying(false);
      setNeedUserGesture(false);
      stopStream();
    }, 12000);
  };

  const scheduleBufferTimeout = () => {
    if (bufferTimeoutRef.current) return;
    bufferTimeoutRef.current = setTimeout(() => {
      setIsBuffering(false);
      setStreamError(true);
      setIsPlaying(false);
      setNeedUserGesture(false);
      stopStream();
    }, 20000);
  };

  // Handle HLS / HTML5 Video Stream Loading
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
      video.play().then(() => {
        setIsPlaying(true);
        setNeedUserGesture(false);
      }).catch((err) => {
        console.warn("Autoplay blocked on mobile, attempting muted playback:", err);
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => {
          setIsPlaying(true);
          setNeedUserGesture(false);
        }).catch(() => {
          setIsPlaying(false);
          setNeedUserGesture(true);
        });
      });
    };

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        manifestLoadingTimeOut: 12000,
        levelLoadingTimeOut: 12000,
        fragLoadingTimeOut: 12000,
      });
      hls.loadSource(streamUrl);
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
        attemptPlay();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        const lv = (hlsRef.current?.levels || [])[data.level];
        if (lv && hlsRef.current) {
          const curLevel = hlsRef.current.currentLevel;
          if (curLevel === -1) {
            const hint = shortQualityHint(lv.height || 0, lv.bitrate || 0);
            setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn("HLS fatal error encountered:", data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          } else {
            setStreamError(true);
          }
        }
      });
    } else {
      // Standard HTML5 video element playback for native HLS (Safari/iOS) or standard URLs
      video.src = streamUrl;
      video.load();
      attemptPlay();
    }

    return () => {
      clearStreamTimers();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, reloadSeq]);

  // Video event handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setNeedUserGesture(false);
      }).catch(() => {
        setNeedUserGesture(true);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
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

    // Native immersive fullscreen (Capacitor APK) - hides Android system bars
    if (isNativeApp) {
      if (targetFs) {
        await enterImmersiveMode();
        ScreenOrientation.lock({ orientation: "landscape" }).catch(() => {
          try {
            const orientation = (screen as any).orientation || (window.screen as any).orientation;
            if (orientation && typeof orientation.lock === "function") orientation.lock("landscape").catch(() => {});
          } catch {}
        });
      } else {
        await exitImmersiveMode();
        ScreenOrientation.unlock().catch(() => {
          try {
            const orientation = (screen as any).orientation || (window.screen as any).orientation;
            if (orientation && typeof orientation.unlock === "function") orientation.unlock();
          } catch {}
        });
      }
      return;
    }

    // HTML5 Fullscreen API (for Web Browsers)
    const target = playerShellRef.current || videoRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      ScreenOrientation.unlock().catch(() => {
        try {
          const orientation = (screen as any).orientation || (window.screen as any).orientation;
          if (orientation && typeof orientation.unlock === "function") orientation.unlock();
        } catch {}
      });
    } else {
      target.requestFullscreen().catch(() => {});
      ScreenOrientation.lock({ orientation: "landscape" }).catch(() => {
        try {
          const orientation = (screen as any).orientation || (window.screen as any).orientation;
          if (orientation && typeof orientation.lock === "function") orientation.lock("landscape").catch(() => {});
        } catch {}
      });
    }
  };

  const handleQualitySelect = (mode: "auto" | number) => {
    const hls = hlsRef.current;
    if (!hls) {
      setShowQualityMenu(false);
      return;
    }
    if (mode === "auto") {
      hls.currentLevel = -1;
      const lv = hls.levels[hls.autoLevelCapping];
      if (lv) {
        const hint = shortQualityHint(lv.height || 0, lv.bitrate || 0);
        setSelectedQuality(`Auto${hint ? ` • ${hint}` : ""}`);
      } else {
        setSelectedQuality("Auto");
      }
    } else {
      hls.currentLevel = mode;
      const lv = hls.levels[mode];
      if (lv) {
        const label = describeQualityLabel(lv.height || 0, lv.bitrate || 0) || `Level ${mode + 1}`;
        setSelectedQuality(label);
      }
    }
    setShowQualityMenu(false);
  };

  // Channel Categories & Regions
  const categories = ["All", "News", "Entertainment", "Sports", "Kids", "Science", "Business", "Culture", "Local ID"];
  const regions = ["All", "Asia", "Indonesia", "Europe", "Americas", "Middle East", "Oceania"];

  // Filtered channel list
  const filteredChannels = liveChannels.filter(ch => {
    const matchesSearch = ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ch.country || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Category filter
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

    // Region filter
    if (selectedRegion !== "All") {
      const country = ch.country || "";
      const asiaCountries = ["Japan", "South Korea", "China", "Singapore", "Turkey", "Qatar", "Pakistan", "Indonesia"];
      const europeCountries = ["Germany", "France", "United Kingdom", "Russia"];
      const americasCountries = ["United States", "Canada", "Brazil"];
      const middleEastCountries = ["Qatar", "Turkey", "Saudi Arabia", "UAE"];
      const oceaniaCountries = ["Australia", "New Zealand"];

      if (selectedRegion === "Indonesia" && country !== "Indonesia" && !ch.id.startsWith("tv-")) return false;
      if (selectedRegion === "Asia" && !asiaCountries.includes(country)) return false;
      if (selectedRegion === "Europe" && !europeCountries.includes(country)) return false;
      if (selectedRegion === "Americas" && !americasCountries.includes(country)) return false;
      if (selectedRegion === "Middle East" && !middleEastCountries.includes(country)) return false;
      if (selectedRegion === "Oceania" && !oceaniaCountries.includes(country)) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 sm:pb-20 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      
      {/* Top Header Tagline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <span className="text-xs font-black tracking-widest text-red-500 uppercase">
              {t?.liveTvCenter || "LIVE BROADCAST CENTER"}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mt-1">
            {t?.liveTvTitle || "Live TV — Free-to-Air Worldwide"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t?.liveTvSubTitle || "Free 24/7 live streaming from TV stations worldwide — news, entertainment, science, sports, & culture."}
          </p>
        </div>

        {/* Quick Channel Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t?.searchTvPlaceholder || "Search TV channels..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-500 transition-all"
          />
        </div>
      </div>

      {/* Main Layout Grid: Player on Left/Top (2/3 width), Channel Switcher on Right (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT / TOP SECTION: Integrated Dedicated Live Player */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={playerShellRef}
            className={`bg-black overflow-hidden shadow-2xl border group transition-all ${
              isFullscreen && isNativeApp
                ? "fixed inset-0 z-50 rounded-none border-0 w-full h-full"
                : "relative aspect-video min-h-[220px] sm:min-h-0 max-h-[70vh] rounded-xl sm:rounded-2xl border-white/10 fullscreen:rounded-none fullscreen:border-0"
            }`}
          >
            
            {/* HTML5 Video Element with HLS.js */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              onWaiting={() => {
                setIsBuffering(true);
                scheduleBufferTimeout();
              }}
              onPlaying={() => {
                setIsBuffering(false);
                setStreamError(false);
                clearStreamTimers();
              }}
              onError={() => {
                setIsBuffering(false);
                setStreamError(true);
                clearStreamTimers();
              }}
            />

            {/* Live Station Pulsing Badge Overlay */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-black/70 backdrop-blur-md border border-red-500/40 rounded-lg shadow-lg max-w-[calc(100%-1rem)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider truncate">
                {activeChannel?.title || "LIVE STREAM"}
              </span>
              <span className="text-[9px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded uppercase border border-red-500/30">
                LIVE
              </span>
            </div>

            {/* Side Quick Channel Switchers for Mobile / Android APK */}
            {liveChannels.length > 1 && (
              <>
                <button
                  onClick={handlePrevChannel}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-90 hover:opacity-100 shadow-xl cursor-pointer"
                  title="Channel Sebelumnya"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextChannel}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-90 hover:opacity-100 shadow-xl cursor-pointer"
                  title="Channel Berikutnya"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Mobile Touch-to-Play Autoplay Bypass Overlay */}
            {needUserGesture && !streamError && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center z-25 p-4 text-center">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all transform active:scale-95 cursor-pointer mb-3"
                >
                  <Play className="w-8 h-8 ml-1 text-white fill-white" />
                </button>
                <h4 className="text-sm font-bold text-white">Sentuh Untuk Memutar Live TV</h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                  Kebijakan browser seluler memerlukan sentuhan manual pertama untuk memulai siaran langsung.
                </p>
              </div>
            )}

            {/* Buffering Indicator */}
            {isBuffering && !streamError && !needUserGesture && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-3">
                <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-300 font-medium">{t?.connectingLive || "Connecting to live broadcast..."}</span>
              </div>
            )}

            {/* Stream Error Overlay */}
            {streamError && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center z-30 space-y-3 px-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{t?.signalLost || "Broadcast Signal Lost"}</h4>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    {t?.signalLostDesc || "TV station is currently offline or experiencing stream server issues."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStreamError(false);
                      setIsBuffering(true);
                      setReloadSeq((s) => s + 1);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t?.reconnectBtn || "Try Reconnecting"}
                  </button>
                </div>
              </div>
            )}

            {/* In-Player HUD Control Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 sm:p-4 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between gap-2 sm:gap-4 pb-safe-plus">
              
              {/* Left Controls: Play/Pause & Mute */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="hidden sm:block w-20 accent-red-600 bg-zinc-700 h-1 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Controls: Quality, Fullscreen */}
              <div className="relative flex items-center gap-2">
                {/* Video Quality Selector */}
                {qualityLevels.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowQualityMenu((v) => !v)}
                      className="player-menu-btn px-3 py-2 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer min-h-11 sm:min-h-0"
                      style={{ boxShadow: selectedQuality.startsWith("Auto") ? `0 0 0 1px ${brandColor}40` : undefined }}
                      title={t?.videoQuality || "Video Quality"}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: brandColor }} />
                      <span className="hidden sm:inline whitespace-nowrap">{selectedQuality}</span>
                    </button>

                    {showQualityMenu && (
                      <div className="player-menu-popover absolute bottom-12 right-12 sm:right-14 z-40 w-56 rounded-xl bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest font-mono" style={{ color: brandColor }}>
                            {t?.videoQuality || "Video Quality"}
                          </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                          <button
                            onClick={() => handleQualitySelect("auto")}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold transition-all hover:bg-white/10 cursor-pointer ${
                              selectedQuality.startsWith("Auto")
                                ? "text-white"
                                : "text-white"
                            }`}
                            style={selectedQuality.startsWith("Auto") ? { backgroundColor: `${brandColor}25`, color: brandColor } : undefined}
                          >
                            <span>Auto</span>
                            {selectedQuality.startsWith("Auto") && <Check className="w-3.5 h-3.5" style={{ color: brandColor }} />}
                          </button>
                          {qualityLevels
                            .slice()
                            .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
                            .map((lv) => {
                              const active =
                                !selectedQuality.startsWith("Auto") &&
                                selectedQuality === lv.label;
                              return (
                                <button
                                  key={lv.index}
                                  onClick={() => handleQualitySelect(lv.index)}
                                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-all hover:bg-white/10 cursor-pointer ${
                                    active ? "text-white" : "text-zinc-200"
                                  }`}
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
                  </>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title={isFullscreen ? (t?.exitFullscreen || "Exit Fullscreen") : (t?.toggleFullscreen || "Fullscreen")}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5 text-red-400" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Active Channel Details Card */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                  <img 
                    src={activeChannel?.posterUrl} 
                    alt={activeChannel?.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    {activeChannel?.title}
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                      {t?.officialHdStream || "Official HD Stream"}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{activeChannel?.country || "Indonesia"}</span>
                    <span>•</span>
                    <span className="text-zinc-300 font-medium">{activeChannel?.language || "Global"}</span>
                    <span>•</span>
                    <span className="text-red-400 font-bold uppercase">{activeChannel?.quality || "Full HD"}</span>
                  </div>
                </div>
              </div>

              {onSelectMovie && (
                <button
                  onClick={() => onSelectMovie(activeChannel)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{t?.stationDetails || "Station Details"}</span>
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              {activeChannel?.description}
            </p>
          </div>
        </div>

        {/* RIGHT SECTION: Interactive TV Channel Switcher & EPG Guide */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-4 backdrop-blur-md">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {t?.channelList || "Channel List"} ({filteredChannels.length})
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{t?.oneClickSelect || "1-Click Select"}</span>
          </div>

          {/* Category Pill Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {t?.[cat] || cat}
              </button>
            ))}
          </div>

          {/* Region Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedRegion === region
                    ? "bg-blue-600/80 text-white border-blue-500/60 shadow-sm shadow-blue-600/30"
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600"
                }`}
              >
                {t?.[region] || region}
              </button>
            ))}
          </div>

          {/* Scrollable Channel List Items */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredChannels.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                {t?.noMatchingTv || "No TV channels matching search"} "{searchQuery}"
              </div>
            ) : (
              filteredChannels.map((channel) => {
                const isActive = activeChannel?.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannel(channel);
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer ${
                      isActive
                        ? "bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50"
                        : "bg-zinc-900/80 hover:bg-zinc-800/90 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={channel.posterUrl} 
                          alt={channel.title} 
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isActive ? "text-red-400" : "text-white group-hover:text-red-400"}`}>
                          {channel.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {channel.genres.join(", ") || "TV Stream"}
                        </p>
                      </div>
                    </div>

                    {/* Playing indicator or Play Arrow */}
                    {isActive ? (
                      <div className="flex items-center gap-1.5 shrink-0 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span>{t?.playingNow || "PLAYING"}</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-red-600 text-zinc-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
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
