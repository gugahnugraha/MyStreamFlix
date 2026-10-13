/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Heart, 
  Star, 
  Send, 
  Users, 
  Film, 
  Globe, 
  MessageSquare, 
  AlertTriangle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Clapperboard,
  Eye,
  ThumbsUp,
  Clock,
  Calendar,
  Tv,
  Subtitles as SubtitlesIcon
} from "lucide-react";
import { Movie, Review, User, getLocalizedDescription } from "../types";

interface MovieDetailModalProps {
  movieId: string;
  currentUser: User | null;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onSelectCast?: (castId: number | string) => void;
  t?: any;
  currentLanguage?: "en" | "id" | "es";
}

export default function MovieDetailModal({
  movieId,
  currentUser,
  isFavorite,
  onToggleFavorite,
  onClose,
  onPlay,
  onSelectCast,
  t,
  currentLanguage = "en",
}: MovieDetailModalProps) {
  const [activeId, setActiveId] = useState(movieId);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Cast slider horizontal scroll ref
  const castSliderRef = useRef<HTMLDivElement>(null);
  const trailerRef = useRef<HTMLDivElement>(null);

  // Season and episode state inside the details dialog
  const [activeModalSeason, setActiveModalSeason] = useState<any>(null);

  // Sync activeModalSeason when movie loaded
  useEffect(() => {
    if (movie && movie.contentType === "series" && movie.seasons && movie.seasons.length > 0) {
      setActiveModalSeason(movie.seasons[0]);
    } else {
      setActiveModalSeason(null);
    }
  }, [movie]);

  // Sync activeId when prop changes
  useEffect(() => {
    setActiveId(movieId);
  }, [movieId]);

  // Review Form state
  const [userRating, setUserRating] = useState(10);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "episodes" | "reviews">("overview");

  // Fetch complete movie details
  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/movies/${activeId}`);
      if (!res.ok) throw new Error("Could not load movie information.");
      const data = await res.json();
      setMovie(data);
      setReviews(data.reviews || []);
      
      // Fetch similar recommendations
      fetchSimilarRecommendations(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarRecommendations = async (currentMovie: Movie) => {
    try {
      const res = await fetch("/api/movies");
      if (res.ok) {
        const allMovies: Movie[] = await res.json();
        const filtered = allMovies.filter(m => 
          m.id !== currentMovie.id && 
          m.contentType !== "livetv" && 
          !m.id.startsWith("tv-") &&
          m.genres.some(g => currentMovie.genres.includes(g))
        );
        const recommendations = filtered.length > 0 
          ? filtered 
          : allMovies.filter(m => m.id !== currentMovie.id && m.contentType !== "livetv" && !m.id.startsWith("tv-"));
        setSimilarMovies(recommendations.slice(0, 4));
      }
    } catch (e) {
      console.warn("Could not retrieve recommendations:", e);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
    setActiveDetailTab("overview");
  }, [activeId]);

  // Cast slider scroll buttons
  const scrollCast = (direction: "left" | "right") => {
    if (castSliderRef.current) {
      const scrollOffset = direction === "left" ? -280 : 280;
      castSliderRef.current.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  };

  // Scroll to trailer
  const scrollToTrailer = () => {
    if (activeDetailTab !== "overview") {
      setActiveDetailTab("overview");
    }
    setTimeout(() => {
      trailerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // Share movie link to clipboard
  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/movies?id=${movie?.id}`;
      navigator.clipboard?.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  // Submit User Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setReviewMessage("Please register or login to write a review!");
      return;
    }
    if (!userComment.trim()) {
      setReviewMessage("Please enter a comment.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewMessage("");
      const res = await fetch(`/api/movies/${activeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: userRating, comment: userComment }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit review.");
      }

      const data = await res.json();
      const addedReview: Review = data.review;
      setReviews((prev) => [addedReview, ...prev]);
      setUserComment("");
      setReviewMessage("Review posted successfully!");

      if (movie) {
        setMovie({ ...movie, rating: data.newMovieRating });
      }
    } catch (err: any) {
      setReviewMessage(err.message || "Submission failed.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" id="detail-modal-loading">
        <div className="flex flex-col items-center gap-4 bg-zinc-900/90 border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
          <p className="text-xs text-zinc-300 font-semibold tracking-wide">{t.retrievingTitleDetails || "Retrieving Cinematic Details..."}</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" id="detail-modal-error">
        <div className="bg-zinc-900 border border-white/10 p-7 rounded-2xl max-w-sm text-center shadow-2xl space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
          <h3 className="text-white font-black text-base">{error || t.failedToLoadMovieInfo || "Failed to load movie information"}</h3>
          <p className="text-xs text-zinc-400">The title details could not be retrieved at this time.</p>
          <button 
            onClick={onClose}
            className="w-full py-2.5 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer hover:brightness-110"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            {t.closeDialog || "Close Dialog"}
          </button>
        </div>
      </div>
    );
  }

  const detailTabs = [
    { id: "overview", label: t.overviewTab || "Overview", icon: Film, count: null },
    ...(movie.contentType === "series" ? [{ id: "episodes", label: t.episodesTab || "Episodes", icon: Tv, count: movie.seasons?.reduce((sum, season) => sum + season.episodes.length, 0) || 0 }] : []),
    { id: "reviews", label: t.reviewsTab || "Reviews", icon: MessageSquare, count: reviews.length }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-lg flex justify-center p-0 sm:p-4 md:py-8 lg:py-12 animate-fade-in-quick" id="detail-modal">
      {/* Background click to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Card Container with Cinema Glass Styling */}
      <div className="cinema-surface rounded-none sm:rounded-3xl overflow-hidden w-full max-w-5xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative flex flex-col min-h-screen sm:min-h-0 h-fit pb-safe border border-white/10 bg-[#09090b]">
        
        {/* Floating Top Header Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            title="Share Movie Link"
            id="detail-modal-share"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95 hover:border-red-500/50"
            id="detail-modal-close"
            title="Close Details"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Ultra-Cinematic Hero Banner */}
        <div className="relative min-h-[400px] md:min-h-[460px] w-full flex flex-col justify-end overflow-hidden">
          {/* High-res Backdrop Image */}
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover object-top filter brightness-90 transform scale-100 transition-transform duration-700 hover:scale-102"
            referrerPolicy="no-referrer"
          />

          {/* Cinematic Lighting Vignette */}
          <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-[#09090b]/80 via-45% to-black/30" />
          <div className="absolute inset-0 bg-linear-to-r from-[#09090b]/90 via-[#09090b]/40 to-transparent" />
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{ background: "radial-gradient(ellipse at 15% 85%, var(--theme-primary-30) 0%, transparent 55%)" }}
          />

          {/* Hero Content Container */}
          <div className="relative p-5 sm:p-7 md:p-8 z-10 w-full mt-28 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              
              {/* Interactive Poster Card with 3D Elevation */}
              <div className="group relative w-32 sm:w-36 md:w-44 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300 hover:scale-102 hover:border-white/40">
                <img
                  src={movie.posterUrl || movie.backdropUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => onPlay(movie)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                  aria-label={`Play ${movie.title}`}
                >
                  <span 
                    className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                    style={{ backgroundColor: "var(--theme-primary)" }}
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </span>
                </button>
              </div>

              {/* Title, Badges & Action Toolbar */}
              <div className="min-w-0 flex-1 space-y-3">
                
                {/* Meta Badges Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {movie.tier && movie.tier !== "free" && (
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider shadow-md ${
                        movie.tier === "premium" ? "bg-amber-400 text-black font-extrabold" : "text-white"
                      }`}
                      style={movie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary)" }}
                    >
                      {movie.tier.toUpperCase()} VIP
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 text-[10px] font-black text-white rounded-md tracking-wider shadow-xs" style={{ backgroundColor: "var(--theme-primary)" }}>
                    {movie.quality}
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white/10 text-zinc-200 rounded-md border border-white/15 backdrop-blur-xs">
                    {movie.ageRating}
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-black/60 text-zinc-300 rounded-md border border-white/10 backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {movie.contentType === "series" 
                      ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? (t.season || "Season") : (t.seasons || "Seasons")}` 
                      : `${movie.duration}m`}
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-300 rounded-md border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {movie.rating} / 10
                  </span>
                </div>

                {/* Big Display Title */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                  {movie.title}
                </h1>

                {/* Year, Genres & Meta Line */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300">
                  <span className="font-semibold">{movie.releaseYear}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="font-medium text-zinc-300 line-clamp-1">{movie.genres.join(", ")}</span>
                  {movie.language && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400 uppercase font-mono text-[11px]">{movie.language}</span>
                    </>
                  )}
                </div>

                {/* Short Synopsis Preview */}
                <p className="max-w-3xl text-xs md:text-sm text-zinc-300/90 leading-relaxed line-clamp-2 md:line-clamp-3 font-normal pt-1">
                  {getLocalizedDescription(movie, currentLanguage)}
                </p>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onPlay(movie)}
                    className="flex items-center gap-2.5 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-xl cursor-pointer hover:brightness-110 active:scale-95"
                    style={{ 
                      backgroundColor: "var(--theme-primary)", 
                      boxShadow: "0 10px 25px -5px var(--theme-primary-50)" 
                    }}
                    id="modal-play-btn"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {t.watch || "Stream Now"}
                  </button>

                  {movie.trailerUrl && (
                    <button
                      onClick={scrollToTrailer}
                      className="h-11 px-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all cursor-pointer backdrop-blur-md active:scale-95"
                      title="Watch Official Trailer"
                    >
                      <Film className="w-4 h-4 text-red-500" />
                      {t.watchTrailer || "Trailer"}
                    </button>
                  )}
 
                  <button
                    onClick={() => onToggleFavorite(movie.id)}
                    className={`h-11 px-4 flex items-center gap-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 backdrop-blur-md ${
                      isFavorite(movie.id)
                        ? "bg-red-500/10 border-red-500/50 text-red-400"
                        : "bg-white/5 border-white/15 text-zinc-300 hover:text-white hover:bg-white/10"
                    }`}
                    title="Add to Watchlist"
                    id="modal-fav-btn"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(movie.id) ? "fill-current text-red-500" : ""}`} />
                    {isFavorite(movie.id) ? (t.inList || "In List") : (t.myList || "My List")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphic Tab Navigation Bar */}
        <div className="px-5 md:px-8 pt-4 border-t border-white/10 bg-[#09090b]/95 backdrop-blur-md">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {detailTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeDetailTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                    isActive
                      ? "text-white border-transparent shadow-lg"
                      : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5"
                  }`}
                  style={isActive ? { backgroundColor: "var(--theme-primary)", boxShadow: "0 8px 20px -4px var(--theme-primary-30)" } : {}}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-400"}`} />
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${isActive ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Detail Body Grid */}
        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 bg-[#09090b]">
          
          {/* Left Column: Media Presentation, Cast Slider, Episodes, Reviews */}
          <div className="md:col-span-2 space-y-6">
            
            {activeDetailTab === "overview" && (
              <div className="space-y-6 animate-fade-in-quick">
                
                {/* Official Trailer Cinema Player */}
                {movie.trailerUrl && (
                  <div ref={trailerRef} className="cinema-panel rounded-2xl p-4.5 border border-white/10 bg-zinc-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-zinc-300 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                        <Film className="w-4 h-4 text-red-500" />
                        {t.watchTrailer || "Official Trailer"}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-medium">Full HD Preview</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video w-full shadow-2xl relative">
                      <iframe
                        src={movie.trailerUrl}
                        title={`${movie.title} Trailer`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Synopsis Section */}
                <div className="cinema-panel rounded-2xl p-5 border border-white/10 bg-zinc-900/40 space-y-2">
                  <h3 className="text-zinc-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                    <Clapperboard className="w-3.5 h-3.5 text-zinc-400" />
                    {t.synopsis || "Storyline & Synopsis"}
                  </h3>
                  <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed font-normal">
                    {getLocalizedDescription(movie, currentLanguage)}
                  </p>
                </div>

                {/* Starring Cast Interactive Slider */}
                {((movie.tmdbCast && movie.tmdbCast.length > 0) || (movie.cast && movie.cast.length > 0)) && (
                  <div className="cinema-panel rounded-2xl p-5 border border-white/10 bg-zinc-900/40 space-y-3.5" id="modal-cast-section">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white text-sm font-black flex items-center gap-2">
                          <Users className="w-4 h-4 text-red-500" />
                          {t.starringCast || "Starring Cast"}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {t.clickCastToView || "Click actor to view profile & filmography"}
                        </p>
                      </div>

                      {/* Slider Navigation Arrows */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => scrollCast("left")}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollCast("right")}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Cast Avatars Track */}
                    <div 
                      ref={castSliderRef}
                      className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent scroll-smooth"
                    >
                      {(movie.tmdbCast && movie.tmdbCast.length > 0) ? (
                        movie.tmdbCast.slice(0, 20).map((actor) => (
                          <div
                            key={actor.id}
                            onClick={() => onSelectCast?.(actor.id)}
                            className="group shrink-0 w-28 flex flex-col items-center text-center p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-red-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-95 shadow-sm"
                            title={`View profile & credits for ${actor.name}`}
                          >
                            <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2.5 border-2 border-white/10 group-hover:border-red-500 group-hover:scale-105 transition-all duration-300 shadow-md bg-zinc-900">
                              {actor.profilePath ? (
                                <img
                                  src={actor.profilePath}
                                  alt={actor.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-bold bg-zinc-800">
                                  {actor.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-zinc-100 group-hover:text-white line-clamp-1 w-full">
                              {actor.name}
                            </span>
                            {actor.character && (
                              <span className="text-[10px] text-zinc-400 italic line-clamp-1 mt-0.5 w-full">
                                {actor.character}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        movie.cast.map((actor, idx) => (
                          <div
                            key={idx}
                            onClick={() => onSelectCast?.(actor)}
                            className="group shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-red-500/40 transition-all cursor-pointer active:scale-95"
                          >
                            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-bold border border-white/10">
                              {actor.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white">{actor}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
 
                {/* Quick Spec Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: t.views || "Total Views", value: movie.views.toLocaleString(), icon: Eye },
                    { label: t.likes || "Favorites", value: movie.likes.toLocaleString(), icon: ThumbsUp },
                    { label: t.country || "Origin Country", value: t[movie.country as keyof typeof t] || movie.country, icon: Globe },
                    { label: t.audio || "Original Audio", value: t[movie.language as keyof typeof t] || movie.language, icon: Film }
                  ].map((stat, idx) => {
                    const StatIcon = stat.icon;
                    return (
                      <div key={idx} className="rounded-xl border border-white/10 bg-zinc-900/40 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-zinc-500">
                          <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                          <StatIcon className="w-3.5 h-3.5" />
                        </div>
                        <p className="mt-2 text-xs sm:text-sm font-black text-white truncate">{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Episodes Explorer for TV Series */}
            {activeDetailTab === "episodes" && movie.contentType === "series" && movie.seasons && movie.seasons.length > 0 && (
              <div className="animate-fade-in-quick space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-white text-base font-black flex items-center gap-2">
                    <Tv className="w-4 h-4 text-red-500" />
                    {t.browseEpisodes || "Episodes Guide"}
                  </h3>
                  
                  {/* Season selector pills */}
                  <div className="flex gap-1.5 overflow-x-auto max-w-full sm:max-w-md scrollbar-none pb-1 sm:pb-0">
                    {movie.seasons.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveModalSeason(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all border ${
                          activeModalSeason?.id === s.id
                            ? "text-white shadow-md shadow-red-600/15 border-transparent"
                            : "bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10"
                        }`}
                        style={activeModalSeason?.id === s.id ? { backgroundColor: "var(--theme-primary)" } : {}}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Episodes list */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {activeModalSeason?.episodes.map((ep: any) => (
                    <div 
                      key={ep.id}
                      className="cinema-panel p-3.5 rounded-xl border border-white/10 bg-zinc-900/40 flex gap-4 hover:border-white/25 transition-all group cursor-pointer"
                      onClick={() => onPlay(movie)}
                    >
                      <div className="relative w-32 aspect-video shrink-0 bg-zinc-900 rounded-lg overflow-hidden border border-white/10">
                        <img 
                          src={movie.backdropUrl || movie.posterUrl} 
                          alt={ep.title} 
                          className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-black/85 px-1.5 py-0.5 rounded text-zinc-300">
                          {ep.duration}m
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-red-500 font-mono">EP {ep.episodeNumber}</span>
                          <span className="text-xs sm:text-sm font-bold text-white group-hover:[color:var(--theme-primary)] transition-colors truncate">
                            {ep.title}
                          </span>
                        </div>
                        {ep.description ? (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{ep.description}</p>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">No episode synopsis available.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Community Board */}
            {activeDetailTab === "reviews" && (
              <div className="animate-fade-in-quick space-y-4">
                <h3 className="text-white text-base font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  {(t.communityReviews || "Community Reviews")} ({reviews.length})
                </h3>

                {/* Review Submit Form */}
                {currentUser ? (
                  <form onSubmit={handleSubmitReview} className="cinema-panel p-4.5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-200 font-bold">{t.writeReview || "Write a Review"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400 font-medium">{t.yourRating || "Your Rating:"}</span>
                        <select
                          value={userRating}
                          onChange={(e) => setUserRating(Number(e.target.value))}
                          className="bg-zinc-900 border border-white/15 text-xs font-bold text-amber-400 p-1.5 rounded-lg focus:outline-hidden"
                          id="review-rating-select"
                        >
                          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>★ {r}/10</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      placeholder={t.reviewPlaceholder || "Provide your feedback for this title..."}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 p-3 text-xs text-white rounded-xl focus:outline-hidden focus:border-red-500/50"
                      id="review-comment-textarea"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <p className={`text-[11px] font-medium ${
                        reviewMessage.includes("success") ? "text-emerald-400" : "text-amber-400"
                      }`}>{reviewMessage}</p>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 shadow-md"
                        id="review-submit-btn"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submittingReview ? (t.posting || "Posting...") : (t.submit || "Submit")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-zinc-900/30 p-4 rounded-xl border border-dashed border-white/10 text-center">
                    <p className="text-xs text-zinc-400">
                      {t.loginToPostReviews || "Please log in to share your thoughts and reviews."}
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1" id="reviews-list">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic text-center py-6">
                      {t.noReviewsYet || "No reviews yet. Be the first to share your experience!"}
                    </p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="cinema-panel p-4 rounded-xl border border-white/10 bg-zinc-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-200 font-bold">{rev.userName}</span>
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="text-xs font-black">{rev.rating}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>
                        <p className="text-[10px] text-zinc-500 font-mono text-right">{rev.date}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Unified Movie Facts & Technical Specs Panel */}
          <div className="space-y-4">
            
            {/* 1. Score & Cinematic Quality Overview */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Audience Score</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black text-white">{movie.rating}</span>
                    <span className="text-xs text-zinc-400 font-bold">/ 10</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
              </div>

              {/* Visual Rating Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-amber-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, movie.rating * 10))}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 text-right font-medium">Based on verified reviews</p>
              </div>

              {/* Specs Breakdown */}
              <div className="border-t border-white/5 pt-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {t.releaseYear || "Release Year"}
                  </span>
                  <span className="font-bold text-white">{movie.releaseYear}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {movie.contentType === "series" ? (t.totalSeasons || "Total Seasons") : (t.runtime || "Runtime")}
                  </span>
                  <span className="font-bold text-white">
                    {movie.contentType === "series"
                      ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? (t.season || "Season") : (t.seasons || "Seasons")}`
                      : `${movie.duration} ${t.minutes || "minutes"}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    {t.totalStreamViews || "Stream Views"}
                  </span>
                  <span className="font-bold text-white">{movie.views.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                    {t.likesFavorites || "Favorites"}
                  </span>
                  <span className="font-bold text-white">{movie.likes.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. Production & Audio/Subtitle Specifications */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Clapperboard className="w-3.5 h-3.5 text-zinc-400" />
                Technical & Production
              </h4>

              {/* Directing Crew */}
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
                  {t.directingCrew || "Directing Crew"}
                </p>
                <p className="text-xs text-white font-medium">
                  {movie.directors?.join(", ") || "Unknown / Studio Production"}
                </p>
              </div>

              {/* Origins & Audio */}
              <div className="border-t border-white/5 pt-3 space-y-2 text-xs">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                    {t.origins || "Origins"}
                  </p>
                  <p className="text-zinc-200">
                    <span className="text-zinc-400">{t.country || "Country"}:</span> <span className="font-semibold text-white">{t[movie.country as keyof typeof t] || movie.country}</span>
                  </p>
                  <p className="text-zinc-200 mt-0.5">
                    <span className="text-zinc-400">{t.audio || "Audio"}:</span> <span className="font-semibold text-white">{t[movie.language as keyof typeof t] || movie.language}</span>
                  </p>
                </div>
              </div>

              {/* Available Subtitles Chips */}
              {movie.subtitles && movie.subtitles.length > 0 && (
                <div className="border-t border-white/5 pt-3">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <SubtitlesIcon className="w-3 h-3 text-zinc-400" />
                    {t.availableSubtitles || "Subtitles"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.subtitles.map((sub) => (
                      <span 
                        key={sub.id} 
                        className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] text-zinc-300 rounded-md font-mono"
                      >
                        CC: {sub.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* More Like This Recommendations Section */}
        {similarMovies.length > 0 && (
          <div className="px-5 md:px-8 pb-10 border-t border-white/10 pt-6 bg-black/40" id="modal-recommendations">
            <h3 className="text-white text-xs font-black tracking-wider uppercase mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t.moreLikeThis || "More Like This"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarMovies.map((rec) => (
                <div 
                  key={rec.id}
                  onClick={() => setActiveId(rec.id)}
                  className="group bg-zinc-900/60 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1.5 shadow-xl"
                  id={`rec-card-${rec.id}`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                    <img 
                      src={rec.backdropUrl || rec.posterUrl} 
                      alt={rec.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 text-[8px] font-black bg-black/75 text-white rounded border border-white/10 backdrop-blur-xs">
                        {rec.quality}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-black/80 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-xs">
                      ★ {rec.rating}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-zinc-100 group-hover:[color:var(--theme-primary)] transition-colors line-clamp-1">
                      {rec.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-500 font-medium">
                      <span>{rec.releaseYear}</span>
                      <span>{rec.duration}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
