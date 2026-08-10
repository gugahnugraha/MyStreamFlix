/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Star, Heart } from "lucide-react";
import { Movie } from "../types";

interface MovieCarouselProps {
  bannerMovies: Movie[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  t?: any;
}

export default function MovieCarousel({
  bannerMovies,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onPlay,
  t,
}: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Keep currentIndex in bounds when bannerMovies list changes
  useEffect(() => {
    if (currentIndex >= bannerMovies.length) {
      setCurrentIndex(0);
    }
  }, [bannerMovies.length, currentIndex]);

  // Auto scroll banners
  useEffect(() => {
    if (bannerMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [bannerMovies.length]);

  if (!bannerMovies || bannerMovies.length === 0) return null;

  const safeIndex = currentIndex >= bannerMovies.length ? 0 : currentIndex;
  const activeMovie = bannerMovies[safeIndex];

  if (!activeMovie) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerMovies.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerMovies.length) % bannerMovies.length);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <div 
      className="relative w-full min-h-[350px] sm:min-h-[480px] aspect-[16/11] sm:aspect-video md:aspect-[21/9] bg-zinc-950 rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.7)] select-none touch-pan-y" 
      id="hero-carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 select-none">
        <img
          key={`bg-${activeMovie.id}`}
          src={activeMovie.backdropUrl || activeMovie.posterUrl}
          alt={activeMovie.title}
          className="w-full h-full object-cover object-top animate-fade-in-scale"
          referrerPolicy="no-referrer"
        />
        {/* Cinematic Dark Gradients (Apple TV / Disney+ layout) */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 sm:h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Banner Content Container */}
      <div 
        key={`content-${activeMovie.id}`}
        className="absolute inset-x-0 bottom-0 px-4 sm:px-6 md:px-12 pb-5 sm:pb-8 md:pb-12 flex flex-col items-start max-w-3xl animate-slide-up-text z-10"
      >
        {/* Spotlight Badge Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          {activeMovie.tier && activeMovie.tier !== "free" && (
            <span className={`text-[8px] sm:text-[9px] font-black tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md backdrop-blur-md border ${
              activeMovie.tier === "premium" 
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400 font-black" 
                : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
            }`}
            style={activeMovie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary-20)", borderColor: "var(--theme-primary-30)" }}
            >
              {activeMovie.tier.toUpperCase()}
            </span>
          )}
          <span 
            className="text-white text-[8px] sm:text-[9px] font-black tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-white/10 backdrop-blur-md" 
            style={{ backgroundColor: "var(--theme-primary-20)", borderColor: "var(--theme-primary-30)", boxShadow: "0 4px 14px var(--theme-primary-20)" }}
          >
            {t?.trendingTag || "SPOTLIGHT"}
          </span>
          <div className="flex items-center gap-1 text-amber-500 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs border border-white/5">
            <Star className="w-3 h-3 fill-amber-500" />
            <span className="font-extrabold">{activeMovie.rating.toFixed(1)}</span>
          </div>
          <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold px-0.5">
            {activeMovie.releaseYear}
          </span>
          <span className="border border-zinc-700 bg-black/40 text-zinc-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-md">
            {activeMovie.quality}
          </span>
        </div>

        {/* Dynamic Title */}
        <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-1 sm:line-clamp-2 drop-shadow-lg max-w-4xl">
          {activeMovie.title}
        </h1>

        {/* Movie Description */}
        <p className="text-zinc-300 text-xs md:text-sm mt-1.5 sm:mt-3 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl font-medium hidden sm:block">
          {activeMovie.description}
        </p>

        {/* Metadata Badges */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 mt-3 text-xs font-medium text-zinc-400">
          <span className="text-zinc-400">{t?.genres || "Genres"}:</span>
          <span className="text-zinc-200">{activeMovie.genres.map(g => t?.[g] || g).join(", ")}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400">{t?.director || "Director"}:</span>
          <span className="text-zinc-200">{activeMovie.directors.join(", ")}</span>
        </div>

        {/* Action Button Controls - Compact & touch optimized */}
        <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-6 w-full sm:w-auto">
          <button
            onClick={() => onSelect(activeMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 text-black text-xs md:text-sm font-bold px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95"
            style={{ backgroundColor: "#00ADB5", color: "#ffffff", boxShadow: "0 0 20px rgba(0,173,181,0.4)" }}
            id="carousel-play-now"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white ml-0.5" />
            {t?.play || "Play Now"}
          </button>

          <button
            onClick={() => onSelect(activeMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs md:text-sm font-bold px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl border border-white/15 transition-all cursor-pointer backdrop-blur-md hover:scale-[1.02] active:scale-95"
            id="carousel-more-info"
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
            {t?.moreInfo || "More Info"}
          </button>

          <button
            onClick={() => onToggleFavorite(activeMovie.id)}
            className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${
              isFavorite(activeMovie.id)
                ? "hover:bg-white/[0.10]"
                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
            }`}
            style={isFavorite(activeMovie.id) ? { backgroundColor: "rgba(0,173,181,0.15)", borderColor: "rgba(0,173,181,0.4)", color: "#00ADB5" } : {}}
            title={isFavorite(activeMovie.id) ? (t?.removeFromList || "Remove List") : (t?.addToList || "Add List")}
            id="carousel-favorite"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite(activeMovie.id) ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Manual Slide Navigation Controls */}
      {bannerMovies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/10 opacity-0 md:opacity-100 hover:scale-110 transition-all cursor-pointer backdrop-blur-xs z-15"
            id="carousel-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/10 opacity-0 md:opacity-100 hover:scale-110 transition-all cursor-pointer backdrop-blur-xs z-15"
            id="carousel-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dot Rows - Compact Disney Style */}
          <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-12 flex items-center gap-1.5 z-15">
            {bannerMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? "w-5 sm:w-6" : "w-1.5 bg-zinc-600/70 hover:bg-zinc-400"
                }`}
                style={idx === currentIndex ? { backgroundColor: "#00ADB5", boxShadow: "0 0 8px rgba(0,173,181,0.6)" } : {}}
                id={`carousel-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
