/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "../types";
import MovieCard from "./MovieCard";

interface MovieRowItem {
  movie: Movie;
  progress?: { progress: number; duration: number };
}

interface MovieRowProps {
  title: string;
  icon: React.ReactNode;
  items: MovieRowItem[];
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  t: any;
}

export default function MovieRow({ title, icon, items, onSelect, onPlay, t }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrowVisibility = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 10);
      // Give a tiny buffer to avoid rounding issues
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const row = rowRef.current;
    if (row) {
      // Small timeout to allow layout to settle before measuring
      const timeout = setTimeout(() => {
        updateArrowVisibility();
      }, 100);

      row.addEventListener("scroll", updateArrowVisibility);
      window.addEventListener("resize", updateArrowVisibility);
      
      return () => {
        clearTimeout(timeout);
        row.removeEventListener("scroll", updateArrowVisibility);
        window.removeEventListener("resize", updateArrowVisibility);
      };
    }
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      // Scroll by 75% of container client width for smooth navigation
      const offset = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4 relative group/row">
      {/* Row Header */}
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/90">{title}</h2>
      </div>

      {/* Row Carousel Area */}
      <div className="relative w-full">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-[calc(50%+30px)] -translate-x-1/2 w-11 h-11 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer z-30 opacity-0 group-hover/row:opacity-100 backdrop-blur-md"
            style={{ left: "16px" }}
            title="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-[calc(50%+30px)] translate-x-1/2 w-11 h-11 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer z-30 opacity-0 group-hover/row:opacity-100 backdrop-blur-md"
            style={{ right: "16px" }}
            title="Scroll Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal scrollbar-hidden list container */}
        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto py-4 px-1.5 -mx-1.5 scrollbar-none scroll-smooth snap-x"
        >
          {items.map((item) => (
            <div key={item.movie.id} className="w-64 shrink-0 snap-start">
              <MovieCard
                movie={item.movie}
                progress={item.progress}
                onSelect={onSelect}
                onPlay={onPlay}
                t={t}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
