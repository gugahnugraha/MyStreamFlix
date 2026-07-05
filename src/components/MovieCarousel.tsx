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
}

export default function MovieCarousel({
  bannerMovies,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onPlay,
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
    <div className="relative w-full aspect-video md:aspect-[21/9] bg-zinc-950 overflow-hidden border-b border-zinc-900" id="hero-carousel">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 select-none">
        <img
          key={`bg-${activeMovie.id}`}
          src={activeMovie.backdropUrl}
          alt={activeMovie.title}
          className="w-full h-full object-cover object-top animate-fade-in-scale"
          referrerPolicy="no-referrer"
        />
        {/* Cinema Cinematic Dark Gradients (Netflix layout overlay) */}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-black/30" />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/20 to-transparent" />
      </div>

      {/* Banner Content Container */}
      <div 
        key={`content-${activeMovie.id}`}
        className="absolute inset-x-0 bottom-0 px-4 md:px-12 pb-6 md:pb-14 flex flex-col items-start max-w-3xl animate-slide-up-text"
      >
        {/* Spotlight Badge */}
        <div className="flex items-center gap-2 mb-2 md:mb-4">
          <span className="bg-red-600 text-white text-[9px] md:text-[10px] font-black tracking-widest px-2.5 py-1 rounded">
            SPOTLIGHT
          </span>
          <div className="flex items-center gap-1 text-amber-500 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-xs">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span className="font-bold">{activeMovie.rating}</span>
          </div>
          <span className="text-zinc-400 text-xs font-semibold px-1">
            {activeMovie.releaseYear}
          </span>
          <span className="border border-zinc-700 text-zinc-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
            {activeMovie.quality}
          </span>
        </div>

        {/* Dynamic Title with fade and entry animation */}
        <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-lg">
          {activeMovie.title}
        </h1>

        {/* Movie Description */}
        <p className="text-zinc-300 text-xs md:text-sm mt-2 md:mt-4 line-clamp-3 leading-relaxed drop-shadow-md">
          {activeMovie.description}
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium text-zinc-400">
          <span className="text-zinc-300">Genres:</span>
          <span className="text-zinc-100">{activeMovie.genres.join(", ")}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-300">Director:</span>
          <span className="text-zinc-100">{activeMovie.directors.join(", ")}</span>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-wrap items-center gap-3 mt-6 w-full sm:w-auto">
          <button
            onClick={() => onPlay(activeMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs md:text-sm font-bold px-6 py-3 rounded-md shadow-xl transition-all cursor-pointer transform hover:scale-[1.02]"
            id="carousel-play-now"
          >
            <Play className="w-4 h-4 fill-black" />
            Play Now
          </button>

          <button
            onClick={() => onSelect(activeMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs md:text-sm font-bold px-6 py-3 rounded-md border border-zinc-800 transition-all cursor-pointer"
            id="carousel-more-info"
          >
            <Info className="w-4 h-4 text-zinc-400" />
            More Info
          </button>

          <button
            onClick={() => onToggleFavorite(activeMovie.id)}
            className={`w-12 h-12 flex items-center justify-center rounded-md border transition-all cursor-pointer ${
              isFavorite(activeMovie.id)
                ? "bg-red-600/10 border-red-500/50 text-red-500 hover:bg-red-600/20"
                : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="Add to My List"
            id="carousel-favorite"
          >
            <Heart className={`w-5 h-5 ${isFavorite(activeMovie.id) ? "fill-red-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Manual Slide Navigation Controls */}
      {bannerMovies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-red-600 text-white flex items-center justify-center border border-zinc-800/50 hover:border-red-500/50 opacity-0 md:opacity-100 hover:scale-115 transition-all cursor-pointer"
            id="carousel-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-red-600 text-white flex items-center justify-center border border-zinc-800/50 hover:border-red-500/50 opacity-0 md:opacity-100 hover:scale-115 transition-all cursor-pointer"
            id="carousel-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dot Rows */}
          <div className="absolute bottom-4 right-12 flex items-center gap-1.5 z-10">
            {bannerMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? "w-6 bg-red-600" : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                }`}
                id={`carousel-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
