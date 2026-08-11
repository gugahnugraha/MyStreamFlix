import React, { useState, useEffect, useRef } from "react";
import { 
  Tv, Play, Pause, Volume2, VolumeX, Maximize, Search, Sparkles, 
  Radio, Info, Globe, Flame, Check, RefreshCw, AlertCircle, Share2
} from "lucide-react";
import Hls from "hls.js";
import { Movie } from "../types";

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
  
  // State for active playing channel
  const [activeChannel, setActiveChannel] = useState<Movie>(liveChannels[0] || channels[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Video playback states
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerShellRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Initialize active channel if list changes
  useEffect(() => {
    if (liveChannels.length > 0 && !liveChannels.find(c => c.id === activeChannel?.id)) {
      setActiveChannel(liveChannels[0]);
    }
  }, [channels]);

  // Handle HLS / HTML5 Video Stream Loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeChannel?.videoUrl) return;

    let hls: Hls | null = null;
    setIsBuffering(true);
    setStreamError(false);

    const streamUrl = activeChannel.videoUrl;

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeChannel]);

  // Video event handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
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
    const target = playerShellRef.current || videoRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      try {
        const orientation = (screen as any).orientation || (window.screen as any).orientation;
        if (orientation && typeof orientation.unlock === "function") orientation.unlock();
      } catch {}
    } else {
      target.requestFullscreen().catch(() => {});
      try {
        const orientation = (screen as any).orientation || (window.screen as any).orientation;
        if (orientation && typeof orientation.lock === "function") orientation.lock("landscape").catch(() => {});
      } catch {}
    }
  };

  const handleShareChannel = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Channel Categories & Regions
  const categories = ["All", "News", "Entertainment", "Science", "Business", "Culture", "Local ID"];
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
        if (!(ch.country === "Indonesia" || ch.id.startsWith("tv-"))) return false;
      } else if (selectedCategory === "News") {
        if (!ch.genres.some(g => ["News", "Business", "Finance"].includes(g))) return false;
      } else if (selectedCategory === "Entertainment") {
        if (!ch.genres.some(g => ["Entertainment", "Comedy", "K-Drama", "Culture"].includes(g))) return false;
      } else if (selectedCategory === "Science") {
        if (!ch.genres.some(g => ["Science", "Education", "Documentary"].includes(g))) return false;
      } else if (selectedCategory === "Business") {
        if (!ch.genres.some(g => ["Business", "Finance"].includes(g))) return false;
      } else if (selectedCategory === "Culture") {
        if (!ch.genres.some(g => ["Culture", "K-Drama", "Documentary"].includes(g))) return false;
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
              LIVE BROADCAST CENTER
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mt-1">
            Live TV — Free-to-Air Worldwide
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Siaran langsung 24/7 gratis dari stasiun TV di seluruh dunia — berita, hiburan, sains, olahraga, dan kebudayaan.
          </p>
        </div>

        {/* Quick Channel Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari saluran TV..."
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
          <div ref={playerShellRef} className="relative aspect-video min-h-[220px] sm:min-h-0 bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group fullscreen:rounded-none fullscreen:border-0">
            
            {/* HTML5 Video Element with HLS.js */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setStreamError(false);
              }}
              onError={() => {
                setIsBuffering(false);
                setStreamError(true);
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

            {/* Buffering Indicator */}
            {isBuffering && !streamError && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-3">
                <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-300 font-medium">Menghubungkan ke siaran langsung...</span>
              </div>
            )}

            {/* Stream Error Overlay */}
            {streamError && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center z-30 space-y-3 px-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Sinyal Siaran Terputus</h4>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Stasiun TV sedang offline atau mengalami kendala server streaming.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStreamError(false);
                    setIsBuffering(true);
                    if (videoRef.current) {
                      videoRef.current.load();
                      videoRef.current.play().catch(() => {});
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Sambung Ulang
                </button>
              </div>
            )}

            {/* In-Player HUD Control Bar (Only Play/Pause, Volume, Mute, Fullscreen - NO Skip Intro / Duration) */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 sm:p-4 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between gap-2 sm:gap-4">
              
              {/* Left Controls: Play/Pause & Mute */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
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

              {/* Right Controls: Share & Fullscreen */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareChannel}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Bagikan Tautan"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedLink ? "Tersalin!" : "Bagikan"}</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Layar Penuh"
                >
                  <Maximize className="w-4 h-4" />
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
                      Official HD Stream
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{activeChannel?.country || "Indonesia"}</span>
                    <span>•</span>
                    <span className="text-zinc-300 font-medium">Bahasa Indonesia</span>
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
                  <span>Detail Stasiun</span>
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
                Daftar Saluran ({filteredChannels.length})
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">1-Klik Pilih Stream</span>
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
                {cat}
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
                {region}
              </button>
            ))}
          </div>

          {/* Scrollable Channel List Items */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredChannels.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                Tidak ada saluran TV yang cocok dengan pencarian "{searchQuery}"
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
                          {channel.genres.join(", ") || "TV Indonesia"}
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
                        <span>DIPUTAR</span>
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
