/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, Star, Clock } from "lucide-react";
import { Movie } from "../types";

interface MovieCardProps {
  key?: React.Key;
  movie: Movie;
  progress?: { progress: number; duration: number }; // optional continue watching state
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  t?: any;
}

export default function MovieCard({ movie, progress, onSelect, onPlay, t }: MovieCardProps) {
  // Calculate percentage progress if applicable
  const progressPercent = progress 
    ? Math.min(100, Math.round((progress.progress / progress.duration) * 100))
    : 0;

  return (
    <div 
      className="group relative flex flex-col cursor-pointer transition-all duration-300"
      onClick={() => onSelect(movie)}
      id={`movie-card-${movie.id}`}
    >
      {/* Elevated Image Container with Apple TV style styling */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-zinc-900 apple-card-shadow border border-white/[0.04] group-hover:border-white/10 group-hover:scale-[1.04] transition-all duration-450 ease-out">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Dynamic Dark Gradient Cover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/25 opacity-60 group-hover:opacity-75 transition-opacity duration-450" />

        {/* Reflective Glare Sweep Overlay */}
        <div className="apple-card-glare" />

        {/* Center Hover Action Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 bg-black/25">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(movie);
            }}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 hover:!scale-110 active:!scale-95 transition-all duration-300 cursor-pointer border border-white/20"
            style={{ backgroundColor: "var(--theme-primary)", boxShadow: "0 10px 25px var(--theme-primary-40)" }}
            id={`play-btn-${movie.id}`}
          >
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </button>
        </div>

        {/* Top Floating Badge Row - Glassmorphism style */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {movie.contentType === "series" && (
            <span className="px-2 py-0.5 text-[9px] font-black rounded-md border border-white/10 bg-black/45 backdrop-blur-md text-zinc-100 tracking-wider uppercase">
              {t?.tvSeries || "Series"}
            </span>
          )}
          {movie.tier && movie.tier !== "free" && (
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md flex items-center gap-0.5 backdrop-blur-md border ${
              movie.tier === "premium" 
                ? "bg-amber-500/25 border-amber-500/30 text-amber-400" 
                : "bg-red-500/25 border-red-500/30 text-red-400"
            }`}
            style={movie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary-20)", borderColor: "var(--theme-primary-30)" }}
            >
              {movie.tier.toUpperCase()}
            </span>
          )}
          <span className="px-2 py-0.5 text-[9px] font-black bg-black/45 backdrop-blur-md rounded-md border border-white/10 text-zinc-100">
            {movie.quality}
          </span>
          <span className="px-2 py-0.5 text-[9px] font-semibold bg-black/45 backdrop-blur-md text-zinc-300 rounded-md border border-white/10">
            {movie.ageRating}
          </span>
        </div>

        {/* Duration Floating Badge (bottom-right) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium bg-black/60 backdrop-blur-md text-zinc-300 rounded-md border border-white/5 z-10">
          <Clock className="w-2.5 h-2.5 text-zinc-400" />
          <span>
            {movie.contentType === "series"
              ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? (t?.season || "Season") : (t?.seasons || "Seasons")}`
              : `${movie.duration}m`}
          </span>
        </div>

        {/* Continue Watching Progress Overlay */}
        {progress && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/70 h-1 z-20">
            <div 
              className="h-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: "var(--theme-primary)" }}
            />
          </div>
        )}
      </div>

      {/* Movie Details Info Area (Underneath the card poster image) */}
      <div className="mt-3.5 px-1 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-[13px] font-bold text-zinc-100 transition-colors line-clamp-1 group-hover:text-[color:var(--theme-primary)]">
              {movie.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0 text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <span className="text-[10px] font-extrabold">{movie.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400 font-medium">
            <span>{movie.releaseYear}</span>
            <span>•</span>
            <span className="capitalize">
              {movie.contentType === "series" ? (t?.tvSeries || "TV Series") : (t?.movies || "Movie")}
            </span>
          </div>

          <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1 font-normal">
            {movie.genres.map(g => t?.[g] || g).join(", ")}
          </p>
        </div>

        {progress && (
          <div className="mt-2.5 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
            <span>{t?.resume || "Progress"}: {progressPercent}%</span>
            <span>{Math.round(progress.progress / 60)}m {t?.noneOff === "Mati" ? "tersisa" : t?.noneOff === "Desactivado" ? "restante" : "left"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
