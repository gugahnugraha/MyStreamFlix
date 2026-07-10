/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, X, Subtitles, Settings } from "lucide-react";
import { Movie } from "../types";

interface MediaPlayerProps {
  movie: Movie;
  initialProgress?: number; // resume from previous progress in seconds
  onClose: () => void;
  t?: any;
}

export default function MediaPlayer({ movie, initialProgress = 0, onClose, t }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(() => {
    if (movie.contentType === "series" && movie.seasons && movie.seasons.length > 0) {
      return (movie.seasons[0].episodes[0]?.duration || 10) * 60;
    }
    return movie.duration * 60 || 600;
  });
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSubtitle, setActiveSubtitle] = useState<string>("off");

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

  // Auto-hide controls overlay
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
          setShowSubtitleMenu(false);
        }
      }, 3500);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetTimer);
      container.addEventListener("click", resetTimer);
    }

    resetTimer();

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener("mousemove", resetTimer);
        container.removeEventListener("click", resetTimer);
      }
    };
  }, [isPlaying]);

  // Listen to fullscreen changes (e.g. from pressing Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      const orientation = (screen as any).orientation || (window.screen as any).orientation;
      if (isFs) {
        if (orientation && typeof orientation.lock === "function") {
          orientation.lock("landscape").catch((err: any) => {
            console.warn("Screen orientation lock failed:", err);
          });
        }
      } else {
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Video Initialization & Resume Point
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        if (initialProgress > 0 && initialProgress < video.duration - 5) {
          video.currentTime = initialProgress;
        }
        // Auto-play
        video.play().then(() => {
          setIsPlaying(true);
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
      // No native element or environment constraints: auto-start simulation
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

  // Background Beacon: Save streaming checkpoint on API database every 5 seconds
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
        }).catch(err => console.warn("Failed syncing continue progress beacon:", err));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, isSimulating, currentTime, duration, movie.id]);

  // Generate mock subtitles matching active subtitle language
  useEffect(() => {
    if (activeSubtitle === "off") {
      setCurrentCaption("");
      return;
    }

    const t = Math.round(currentTime);
    const captionsMap: Record<string, Record<number, string>> = {
      en: {
        2: "This is a demonstration of the FlixSphere HLS Player.",
        6: "Now showcasing pristine video compression & sound mixing.",
        10: "Feel free to scrub anywhere to trigger instant resume points.",
        15: "FlixSphere delivers marketplace-quality content rendering.",
        25: "Enjoy the high-fidelity cinematic experience."
      },
      es: {
        2: "Esta es una demostración del reproductor HLS de FlixSphere.",
        6: "Ahora se muestra compresión de video y mezcla de sonido impecables.",
        10: "Siéntase libre de avanzar para activar puntos de reanudación.",
        15: "FlixSphere ofrece renderizado de contenido de calidad comercial.",
        25: "Disfrute de la experiencia cinematográfica de alta fidelidad."
      },
      fr: {
        2: "Ceci est une démonstration du lecteur HLS de FlixSphere.",
        6: "Présentation d'une compression vidéo et d'un mixage audio exceptionnels.",
        10: "N'hésitez pas à naviguer pour tester la reprise de lecture.",
        15: "FlixSphere offre un rendu de contenu digne du marché.",
        25: "Profitez de l'expérience cinématographique haute fidélité."
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
      // Find caption that matches nearest rounded seconds
      const matched = Object.keys(activeCap)
        .map(Number)
        .sort((a, b) => b - a)
        .find(sec => t >= sec && t < sec + 4);

      if (matched !== undefined) {
        setCurrentCaption(activeCap[matched]);
      } else {
        setCurrentCaption("");
      }
    } else {
      setCurrentCaption("");
    }
  }, [currentTime, activeSubtitle]);

  // Player controls actions
  const handlePlayPause = () => {
    if (isSimulating) {
      setIsPlaying(!isPlaying);
    } else {
      const video = videoRef.current;
      if (video) {
        if (isPlaying) {
          video.pause();
          setIsPlaying(false);
        } else {
          video.play().then(() => setIsPlaying(true)).catch((err) => {
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
    setIsMuted(vol === 0);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.volume = vol;
      }
    }
  };

  const handleMuteToggle = () => {
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    if (!isSimulating) {
      const video = videoRef.current;
      if (video) {
        video.muted = targetMute;
      }
    }
  };

  const handleSkip = (seconds: number) => {
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

  const handleSubtitleSelect = (lang: string) => {
    setActiveSubtitle(lang);
    setShowSubtitleMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (container) {
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col landscape:flex-row md:flex-row select-none overflow-hidden"
      id="media-player-container"
    >
      {/* Primary Video Screen Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 h-full bg-black flex items-center justify-center overflow-hidden"
      >
        {/* HTML5 Video Layer */}
        {!isSimulating ? (
          <video
            ref={videoRef}
            src={activeEpisode ? activeEpisode.videoUrl : movie.videoUrl}
          className="w-full h-full max-h-screen object-contain"
          onClick={handlePlayPause}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            console.warn("Direct stream load failed. Engaging high-fidelity cinematic stream simulation.");
            setHasError(true);
            setIsSimulating(true);
            setIsPlaying(true);
          }}
          id="video-core-element"
        />
      ) : (
        /* High-fidelity Cinematic Simulation Display */
        <div 
          className="relative w-full h-full flex items-center justify-center bg-zinc-950"
          onClick={handlePlayPause}
          id="simulation-display"
        >
          {/* Animated Zooming Background Backdrop */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xs transition-transform duration-1000 scale-105"
            style={{ 
              backgroundImage: `url(${movie.backdropUrl})`,
              transform: isPlaying ? `scale(${1.08 + Math.sin(currentTime / 10) * 0.03}) rotate(${Math.sin(currentTime / 20) * 0.5}deg)` : 'scale(1.05)'
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
                    {movie.quality}
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
                {activeEpisode?.description || movie.description || (t.simulationDesc || "Direct raw link loading is limited by sandboxed container headers. Playing simulated high-fidelity HLS timeline.")}
              </p>
              {isPlaying ? (
                <div className="flex items-center justify-center gap-1.5 mt-4 text-emerald-500 text-xs font-mono font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {t.streamingQualityLabel || "Streaming @ 4K Ultra HD"}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 mt-4 text-zinc-400 text-xs font-mono font-semibold bg-zinc-800/30 px-3 py-1.5 rounded-full border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  {t.pausedLabel || "Paused"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled Caption Subtitle Overlay */}
      {currentCaption && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-6 py-2 rounded-md bg-black/80 border border-zinc-800 text-center max-w-2xl text-white text-sm md:text-base font-medium shadow-2xl transition-all duration-200">
          {currentCaption}
        </div>
      )}

      {/* HUD Controller Overlay Screen */}
      <div 
        className={`absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/80 flex flex-col justify-between p-4 md:p-8 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        id="media-player-hud"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-red-500 font-mono tracking-wider">
              {t.nowStreaming || "NOW STREAMING"} • {movie.quality}
            </p>
            <h1 className="text-white text-base md:text-xl font-extrabold truncate max-w-md mt-0.5">
              {movie.title} {activeEpisode ? ` • S${activeSeason?.seasonNumber}E${activeEpisode.episodeNumber}: ${activeEpisode.title}` : ""}
            </h1>
          </div>

          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900/80 hover:bg-red-600 text-white flex items-center justify-center border border-zinc-800 transition-colors shadow-lg cursor-pointer"
            id="media-player-exit"
            title={t.exitPlayer || "Exit Player"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Playback HUD panel */}
        <div className="space-y-4">
          {/* Progress Timeline Scrubber */}
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

          {/* Controls Bar Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Play, Rewind, Forward controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSkip(-10)}
                className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title={t.rewind10s || "Rewind 10s"}
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-12 h-12 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center shadow-md cursor-pointer"
                id="hud-play-btn"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black fill-black" />
                ) : (
                  <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title={t.forward10s || "Forward 10s"}
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Volume sliders */}
              <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                <button
                  onClick={handleMuteToggle}
                  className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  id="hud-mute-btn"
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

            {/* Utility Subtitles, Speed and Fullscreen */}
            <div className="flex items-center gap-4 relative">
              {/* Playback speed selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSubtitleMenu(false); }}
                  className="flex items-center gap-1 text-zinc-300 hover:text-white text-xs font-semibold px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-md cursor-pointer"
                  title={t.playbackSpeed || "Playback Speed"}
                >
                  <Settings className="w-4 h-4" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-10 right-0 w-24 bg-zinc-950 border border-zinc-800 p-1 rounded-md shadow-2xl flex flex-col gap-0.5">
                    {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSpeedSelect(r)}
                        className={`text-left text-xs px-2 py-1.5 rounded-sm hover:bg-zinc-900 transition-colors ${
                          playbackRate === r ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Captions Subtitle trigger */}
              {movie.subtitles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => { setShowSubtitleMenu(!showSubtitleMenu); setShowSpeedMenu(false); }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 border rounded-md cursor-pointer ${
                      activeSubtitle !== "off" 
                        ? "bg-red-600/10 border-red-500 text-red-400" 
                        : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white"
                    }`}
                    title={t.toggleCaptions || "Toggle Captions"}
                  >
                    <Subtitles className="w-4 h-4" />
                    <span>{t.toggleCaptions || "Captions"}</span>
                  </button>

                  {showSubtitleMenu && (
                    <div className="absolute bottom-10 right-0 w-32 bg-zinc-950 border border-zinc-800 p-1 rounded-md shadow-2xl flex flex-col gap-0.5">
                      <button
                        onClick={() => handleSubtitleSelect("off")}
                        className={`text-left text-xs px-2 py-1.5 rounded-sm hover:bg-zinc-900 transition-colors ${
                          activeSubtitle === "off" ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                        }`}
                      >
                        {t.noneOff || "Off (None)"}
                      </button>
                      {movie.subtitles.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubtitleSelect(sub.language)}
                          className={`text-left text-xs px-2 py-1.5 rounded-sm hover:bg-zinc-900 transition-colors ${
                            activeSubtitle === sub.language ? "text-red-500 font-bold bg-red-500/10" : "text-zinc-400"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen control */}
              <button
                onClick={toggleFullscreen}
                className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? (t.exitFullscreen || "Exit Fullscreen") : (t.toggleFullscreen || "Toggle Fullscreen")}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
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
        <div className="w-full landscape:w-80 md:w-80 shrink-0 border-t landscape:border-t-0 landscape:border-l md:border-t-0 md:border-l border-zinc-900 bg-zinc-950/95 flex flex-col h-1/3 landscape:h-full md:h-full z-10 text-white select-none relative" id="episodes-sidebar">
          {/* Header */}
          <div className="p-4 border-b border-zinc-900 bg-black/40">
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-zinc-400 mb-2">
              {t.seasonsAndEpisodes || "Seasons & Episodes"}
            </h3>
            {/* Season dropdown selector */}
            <select
              value={activeSeason?.id}
              onChange={(e) => {
                const season = movie.seasons?.find(s => s.id === e.target.value);
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
