/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Play, Heart, Star, Send, Users, Film, Globe, MessageSquare, AlertTriangle, Sparkles } from "lucide-react";
import { Movie, Review, User } from "../types";

interface MovieDetailModalProps {
  movieId: string;
  currentUser: User | null;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  t?: any;
}

export default function MovieDetailModal({
  movieId,
  currentUser,
  isFavorite,
  onToggleFavorite,
  onClose,
  onPlay,
  t,
}: MovieDetailModalProps) {
  const [activeId, setActiveId] = useState(movieId);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          m.genres.some(g => currentMovie.genres.includes(g))
        );
        const recommendations = filtered.length > 0 
          ? filtered 
          : allMovies.filter(m => m.id !== currentMovie.id);
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
      // Add new review locally
      const addedReview: Review = data.review;
      setReviews((prev) => [addedReview, ...prev]);
      setUserComment("");
      setReviewMessage("Review posted successfully!");

      // Update movie rating locally
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs" id="detail-modal-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
          <p className="text-xs text-zinc-400 font-medium">{t.retrievingTitleDetails || "Retrieving Title Details..."}</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" id="detail-modal-error">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg max-w-sm text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--theme-primary)" }} />
          <p className="text-white font-bold">{error || t.failedToLoadMovieInfo || "Failed to load movie info"}</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 text-white rounded text-xs font-semibold hover:brightness-110"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            {t.closeDialog || "Close Dialog"}
          </button>
        </div>
      </div>
    );
  }

  const detailTabs = [
    { id: "overview", label: t.overviewTab || "Overview", count: null },
    ...(movie.contentType === "series" ? [{ id: "episodes", label: t.episodesTab || "Episodes", count: movie.seasons?.reduce((sum, season) => sum + season.episodes.length, 0) || 0 }] : []),
    { id: "reviews", label: t.reviewsTab || "Reviews", count: reviews.length }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center p-4 md:py-10" id="detail-modal">
      {/* Background click to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Card Container */}
      <div className="cinema-surface rounded-lg overflow-hidden w-full max-w-5xl shadow-2xl relative flex flex-col h-fit">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer hover:[background-color:var(--theme-primary)]"
          id="detail-modal-close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact interactive hero */}
        <div className="relative min-h-[360px] md:min-h-[390px] w-full flex flex-col justify-end">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0b0b0d] via-[#0b0b0d]/70 to-black/20" />
          <div className="absolute inset-0 bg-linear-to-r from-black/82 via-black/34 to-transparent" />

          <div className="relative md:absolute md:inset-x-0 md:bottom-0 p-5 md:p-7 z-10 w-full mt-24 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-end gap-5">
              <div className="group relative w-28 md:w-36 aspect-[2/3] shrink-0 rounded-lg overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl shadow-black/60">
                <img
                  src={movie.posterUrl || movie.backdropUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => onPlay(movie)}
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  aria-label={`Play ${movie.title}`}
                >
                  <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </span>
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {movie.tier && movie.tier !== "free" && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                        movie.tier === "premium" ? "bg-amber-500 text-black" : "text-white"
                      }`}
                      style={movie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary)" }}
                    >
                      {movie.tier.toUpperCase()} VIP
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 text-[10px] font-black text-white rounded" style={{ backgroundColor: "var(--theme-primary)" }}>
                    {movie.quality}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-zinc-200 rounded border border-white/10">
                    {movie.ageRating}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-black/45 text-zinc-300 rounded border border-white/10">
                    {movie.contentType === "series" 
                      ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? (t.season || "Season") : (t.seasons || "Seasons")}` 
                      : `${movie.duration}m`}
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                  {movie.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {movie.rating}/10
                  </span>
                  <span>{movie.releaseYear}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="line-clamp-1">{movie.genres.slice(0, 3).join(", ")}</span>
                </div>

                <p className="mt-3 max-w-2xl text-xs md:text-sm text-zinc-300 leading-relaxed line-clamp-2">
                  {movie.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">                  <button
                    onClick={() => onPlay(movie)}
                    className="flex items-center gap-2 text-white font-bold text-xs px-5 py-2.5 rounded-md transition-all shadow-lg cursor-pointer hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: "var(--theme-primary)", boxShadow: "0 14px 30px var(--theme-primary-20)" }}
                    id="modal-play-btn"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {t.watch || "Stream Now"}
                  </button>
 
                  <button
                    onClick={() => onToggleFavorite(movie.id)}
                    className={`h-10 px-3 flex items-center gap-2 rounded-md border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      isFavorite(movie.id)
                        ? ""
                        : "bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.1]"
                    }`}
                    style={isFavorite(movie.id) ? { backgroundColor: "var(--theme-primary-10)", borderColor: "var(--theme-primary-50)", color: "var(--theme-primary)" } : {}}
                    title="Add to Watchlist"
                    id="modal-fav-btn"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(movie.id) ? "fill-current" : ""}`} />
                    {isFavorite(movie.id) ? (t.inList || "In List") : (t.myList || "My List")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-7 pt-5 border-t border-white/10 bg-[#0b0b0d]">
          <div className="flex gap-1.5 overflow-x-auto">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-md text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeDetailTab === tab.id
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
                style={activeDetailTab === tab.id ? { backgroundColor: "var(--theme-primary-10)", color: "var(--theme-primary)" } : {}}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-zinc-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Detail Body Grid */}
        <div className="p-5 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0b0b0d]">
          {/* Left Column: Summary and Review Board */}
          <div className="md:col-span-2 space-y-6">
            {activeDetailTab === "overview" && (
              <div className="space-y-5 animate-fade-in-quick">                <div className="cinema-panel rounded-lg p-4">
                  <h3 className="text-zinc-400 text-xs font-bold tracking-wider uppercase mb-2">{t.synopsis || "Synopsis"}</h3>
                  <p className="text-zinc-200 text-sm leading-relaxed">{movie.description}</p>
                </div>
 
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    [t.views || "Views", movie.views.toLocaleString()],
                    [t.likes || "Likes", movie.likes.toLocaleString()],
                    [t.country || "Country", t[movie.country as keyof typeof t] || movie.country],
                    [t.audio || "Audio", t[movie.language as keyof typeof t] || movie.language]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{label}</p>
                      <p className="mt-1 text-xs font-black text-zinc-100 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Subtitles & Playback Info */}
                {movie.subtitles.length > 0 && (
                  <div className="cinema-panel rounded-lg p-4">
                    <h3 className="text-zinc-400 text-xs font-bold tracking-wider uppercase mb-2">{t.availableSubtitles || "Available Subtitles"}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {movie.subtitles.map((sub) => (
                        <span 
                          key={sub.id} 
                          className="px-2 py-1 bg-white/[0.04] border border-white/10 text-xs text-zinc-300 rounded font-mono"
                        >
                          CC: {sub.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Episodes Explorer for TV Series */}
            {activeDetailTab === "episodes" && movie.contentType === "series" && movie.seasons && movie.seasons.length > 0 && (
              <div className="animate-fade-in-quick">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-white text-sm font-black flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" />
                    {t.browseEpisodes || "Browse Episodes"}
                  </h3>
                  
                  {/* Season selector pills */}
                  <div className="flex gap-1.5 overflow-x-auto max-w-full sm:max-w-md scrollbar-none pb-1 sm:pb-0">
                    {movie.seasons.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveModalSeason(s)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold shrink-0 cursor-pointer transition-all border ${
                          activeModalSeason?.id === s.id
                            ? "text-white shadow-md shadow-red-600/15 border-transparent"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 border-white/10"
                        }`}
                        style={activeModalSeason?.id === s.id ? { backgroundColor: "var(--theme-primary)" } : {}}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Episodes list */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-950 scrollbar-track-transparent">
                  {activeModalSeason?.episodes.map((ep: any) => (
                    <div 
                      key={ep.id}
                      className="cinema-panel p-3 rounded-lg flex gap-4 hover:border-white/20 transition-all group cursor-pointer"
                      onClick={() => onPlay(movie)}
                    >
                      {/* Episode action play trigger */}
                      <div className="relative w-28 aspect-video shrink-0 bg-zinc-900 rounded-md overflow-hidden">
                        <img 
                          src={movie.backdropUrl || movie.posterUrl} 
                          alt={ep.title} 
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={(event) => {
                            event.stopPropagation();
                            onPlay(movie);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Play className="w-6 h-6 text-white fill-white" />
                        </button>
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 py-0.5 rounded text-zinc-400">
                          {ep.duration}m
                        </span>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-red-500 font-mono">EP {ep.episodeNumber}</span>
                          <span className="text-xs font-bold text-zinc-200 group-hover:[color:var(--theme-primary)] transition-colors">{ep.title}</span>
                        </div>
                        {ep.description && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{ep.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Board */}
            {activeDetailTab === "reviews" && (
            <div className="animate-fade-in-quick">
              <h3 className="text-white text-base font-bold flex items-center gap-2 mb-4">
                <MessageSquare className="w-4.5 h-4.5 text-red-500" />
                {(t.communityReviews || "Community Reviews")} ({reviews.length})
              </h3>

              {/* Review Submit Form */}
              {currentUser ? (
                <form onSubmit={handleSubmitReview} className="cinema-panel p-4 rounded-lg space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-semibold">{t.writeReview || "Write a Review"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 font-medium">{t.yourRating || "Your Rating:"}</span>
                      <select
                        value={userRating}
                        onChange={(e) => setUserRating(Number(e.target.value))}
                        className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-amber-500 p-1 rounded focus:outline-hidden"
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
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/10 p-2.5 text-xs text-white rounded focus:outline-hidden focus:border-red-500/50"
                    id="review-comment-textarea"
                  />

                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-medium ${
                      reviewMessage.includes("success") ? "text-emerald-500" : "text-amber-500"
                    }`}>{reviewMessage}</p>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded transition-all cursor-pointer active:scale-95"
                      id="review-submit-btn"
                    >
                      <Send className="w-3 h-3" />
                      {submittingReview ? (t.posting || "Posting...") : (t.submit || "Submit")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-zinc-950/30 p-3 rounded border border-dashed border-zinc-800 text-center mb-6">
                  <p className="text-xs text-zinc-500">
                    {t.loginToPostReviews || "Please log in to post reviews."}
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1" id="reviews-list">
                {reviews.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">{t.noReviewsYet || "No reviews yet. Be the first to share your experience!"}</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="cinema-panel p-3.5 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-300 font-bold">{rev.userName}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span className="text-xs font-black">{rev.rating}/10</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{rev.comment}</p>
                      <p className="text-[9px] text-zinc-600 font-mono text-right">{rev.date}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}
          </div>

          {/* Right Column: Metadata Cards */}
          <div className="space-y-4">
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <Star className="w-4 h-4 text-amber-500 fill-amber-550" />
                <div className="text-xs">
                  <p className="font-bold text-white text-sm">{movie.rating} / 10</p>
                  <p className="text-[10px] text-zinc-500">{t.aggregateRating || "Aggregate Rating"}</p>
                </div>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t.releaseYear || "Release Year"}</span>
                <span className="font-bold text-zinc-200">{movie.releaseYear}</span>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{movie.contentType === "series" ? (t.totalSeasons || "Total Seasons") : (t.runtime || "Runtime")}</span>
                <span className="font-bold text-zinc-200">
                  {movie.contentType === "series"
                    ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? (t.season || "Season") : (t.seasons || "Seasons")}`
                    : `${movie.duration} ${t.minutes || "minutes"}`}
                </span>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t.totalStreamViews || "Total Stream Views"}</span>
                <span className="font-bold text-zinc-200">{movie.views.toLocaleString()}</span>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t.likesFavorites || "Likes / Favorites"}</span>
                <span className="font-bold text-zinc-200">{movie.likes.toLocaleString()}</span>
              </div>
            </div>

            {/* Crew / Cast details */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 space-y-3.5">
              <div>
                <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5" /> {t.directingCrew || "Directing Crew"}
                </p>
                <p className="text-xs text-zinc-200 font-medium pl-5">
                  {movie.directors.join(", ") || "Unknown"}
                </p>
              </div>

              <div className="border-t border-zinc-900/60 pt-3">
                <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Film className="w-3.5 h-3.5" /> {t.starringCast || "Starring Cast"}
                </p>
                <div className="flex flex-wrap gap-1 pl-5">
                  {movie.cast.map((actor, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs text-zinc-200 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-900/60 pt-3">
                <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5" /> {t.origins || "Origins"}
                </p>
                <div className="text-xs text-zinc-300 pl-5 space-y-1">
                  <p>{t.country || "Country"}: <span className="text-white font-medium">{t[movie.country as keyof typeof t] || movie.country}</span></p>
                  <p>{t.audio || "Audio"}: <span className="text-white font-medium">{t[movie.language as keyof typeof t] || movie.language}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Like This recommendations block */}
        {similarMovies.length > 0 && (
          <div className="px-6 pb-8 border-t border-zinc-800/40 pt-6 bg-zinc-950/20" id="modal-recommendations">
            <h3 className="text-white text-xs font-black tracking-wider uppercase mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-550" />
              {t.moreLikeThis || "More Like This"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarMovies.map((rec) => (
                <div 
                  key={rec.id}
                  onClick={() => setActiveId(rec.id)}
                  className="group bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900 hover:border-zinc-700/80 transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1 shadow-md"
                  id={`rec-card-${rec.id}`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    <img 
                      src={rec.backdropUrl || rec.posterUrl} 
                      alt={rec.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <span className="px-1 py-0.5 text-[8px] font-black bg-black/60 text-red-500 rounded border border-red-500/20">
                        {rec.quality}
                      </span>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 text-[9px] font-bold bg-black/70 text-amber-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      ★ {rec.rating}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-1">
                      {rec.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-500 font-medium">
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
