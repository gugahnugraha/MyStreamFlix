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
      className="group relative flex flex-col cinema-surface rounded-lg overflow-hidden transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(0,0,0,0.42)]"
      onClick={() => onSelect(movie)}
      id={`movie-card-${movie.id}`}
    >
      {/* Poster Image with play overlay */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Dynamic Dark Gradient Cover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/92 via-black/16 to-black/34 opacity-65 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Hover Action Indicators */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(movie);
            }}
            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer ring-1 ring-white/20"
            style={{ backgroundColor: "var(--theme-primary)", boxShadow: "0 16px 34px var(--theme-primary-30)" }}
            id={`play-btn-${movie.id}`}
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </button>
        </div>

        {/* Top Floating Badge Row */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {movie.contentType === "series" && (
            <span className="px-1.5 py-0.5 text-[9px] font-black rounded border uppercase tracking-wider theme-chip">
              {t?.tvSeries || "Series"}
            </span>
          )}
          {movie.tier && movie.tier !== "free" && (
            <span className={`px-1.5 py-0.5 text-[9px] font-black rounded flex items-center gap-0.5 ${
              movie.tier === "premium" 
                ? "bg-amber-500 text-black shadow-xs font-black" 
                : "text-white shadow-xs"
            }`}
            style={movie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary)" }}
            >
              {movie.tier.toUpperCase()}
            </span>
          )}
          <span className="px-1.5 py-0.5 text-[9px] font-black bg-black/60 backdrop-blur-md rounded border theme-chip">
            {movie.quality}
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-zinc-950/80 backdrop-blur-md text-zinc-300 rounded border border-zinc-800">
            {movie.ageRating}
          </span>
        </div>

        {/* Duration Floating Badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium bg-black/70 backdrop-blur-md text-zinc-300 rounded">
          <Clock className="w-2.5 h-2.5 text-zinc-400" />
          <span>
            {movie.contentType === "series"
              ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? (t?.season || "Season") : (t?.seasons || "Seasons")}`
              : `${movie.duration}m`}
          </span>
        </div>

        {/* Continue Watching Progress Overlay */}
        {progress && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/60 h-1">
            <div 
              className="h-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: "var(--theme-primary)" }}
            />
          </div>
        )}
      </div>

      {/* Movie Details Info Area */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-sm font-bold text-zinc-100 transition-colors line-clamp-1 group-hover:[color:var(--theme-primary)]">
              {movie.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0 text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <span className="text-[11px] font-bold">{movie.rating}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-zinc-500 font-medium">
              {movie.releaseYear}
            </span>
            <span className="text-[10px] text-zinc-700">•</span>
            <p className="text-[10px] text-zinc-400 line-clamp-1">
              {movie.genres.join(", ")}
            </p>
          </div>
        </div>

        {progress && (
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>{t?.resume || "Progress"}: {progressPercent}%</span>
            <span>{Math.round(progress.progress / 60)}m {t?.noneOff === "Mati" ? "tersisa" : t?.noneOff === "Desactivado" ? "restante" : "left"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
