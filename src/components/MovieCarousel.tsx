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

  return (
    <div 
      className="relative w-full aspect-video md:aspect-[21/9] min-h-[380px] md:min-h-[480px] bg-zinc-950 rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.05] shadow-[0_24px_60px_rgba(0,0,0,0.65)]" 
      id="hero-carousel"
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
        {/* Cinematic Dark Gradients (Apple TV layout) */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Banner Content Container */}
      <div 
        key={`content-${activeMovie.id}`}
        className="absolute inset-x-0 bottom-0 px-6 md:px-12 pb-8 md:pb-12 flex flex-col items-start max-w-3xl animate-slide-up-text z-10"
      >
        {/* Spotlight Badge Row */}
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          {activeMovie.tier && activeMovie.tier !== "free" && (
            <span className={`text-[9px] md:text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md backdrop-blur-md border ${
              activeMovie.tier === "premium" 
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400 font-black" 
                : "bg-red-500/20 border-red-500/30 text-red-400"
            }`}
            style={activeMovie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary-20)", borderColor: "var(--theme-primary-30)" }}
            >
              {activeMovie.tier.toUpperCase()}
            </span>
          )}
          <span 
            className="text-white text-[9px] md:text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md" 
            style={{ backgroundColor: "var(--theme-primary-20)", borderColor: "var(--theme-primary-30)", boxShadow: "0 4px 14px var(--theme-primary-20)" }}
          >
            {t?.trendingTag || "SPOTLIGHT"}
          </span>
          <div className="flex items-center gap-1 text-amber-500 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-md text-xs border border-white/5">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span className="font-extrabold">{activeMovie.rating.toFixed(1)}</span>
          </div>
          <span className="text-zinc-400 text-xs font-semibold px-1">
            {activeMovie.releaseYear}
          </span>
          <span className="border border-zinc-700 bg-black/30 text-zinc-300 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
            {activeMovie.quality}
          </span>
        </div>

        {/* Dynamic Title with fade and entry animation */}
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-lg max-w-4xl">
          {activeMovie.title}
        </h1>

        {/* Movie Description */}
        <p className="text-zinc-300 text-xs md:text-sm mt-3 md:mt-4 line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl font-medium">
          {activeMovie.description}
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium text-zinc-400">
          <span className="text-zinc-400">{t?.genres || "Genres"}:</span>
          <span className="text-zinc-200">{activeMovie.genres.map(g => t?.[g] || g).join(", ")}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400">{t?.director || "Director"}:</span>
          <span className="text-zinc-200">{activeMovie.directors.join(", ")}</span>
        </div>

        {/* Action Button Controls - Glassmorphism & premium styling */}
        <div className="flex flex-wrap items-center gap-3 mt-6 w-full sm:w-auto">
          <button
            onClick={() => onPlay(activeMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs md:text-sm font-bold px-6 py-3.5 rounded-xl shadow-xl transition-all cursor-pointer transform hover:scale-[1.02]"
            id="carousel-play-now"
          >
            <Play className="w-4 h-4 fill-black" />
            {t?.play || "Play Now"}
          </button>

          <button
            onClick={() => onSelect(activeMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs md:text-sm font-bold px-6 py-3.5 rounded-xl border border-white/10 transition-all cursor-pointer backdrop-blur-md hover:scale-[1.02]"
            id="carousel-more-info"
          >
            <Info className="w-4 h-4 text-zinc-300" />
            {t?.moreInfo || "More Info"}
          </button>

          <button
            onClick={() => onToggleFavorite(activeMovie.id)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
              isFavorite(activeMovie.id)
                ? "hover:bg-white/[0.10]"
                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
            }`}
            style={isFavorite(activeMovie.id) ? { backgroundColor: "var(--theme-primary-15)", borderColor: "var(--theme-primary-40)", color: "var(--theme-primary)" } : {}}
            title={isFavorite(activeMovie.id) ? (t?.removeFromList || "Remove List") : (t?.addToList || "Add List")}
            id="carousel-favorite"
          >
            <Heart className={`w-5 h-5 ${isFavorite(activeMovie.id) ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Manual Slide Navigation Controls - Rounded buttons with glass blur */}
      {bannerMovies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center border border-white/10 opacity-0 md:opacity-100 hover:scale-110 transition-all cursor-pointer backdrop-blur-xs z-15"
            id="carousel-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center border border-white/10 opacity-0 md:opacity-100 hover:scale-110 transition-all cursor-pointer backdrop-blur-xs z-15"
            id="carousel-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dot Rows */}
          <div className="absolute bottom-4 right-12 flex items-center gap-2 z-15">
            {bannerMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? "w-6" : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                }`}
                style={idx === currentIndex ? { backgroundColor: "var(--theme-primary)" } : {}}
                id={`carousel-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
