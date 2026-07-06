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
          <p className="text-xs text-zinc-400 font-medium">Retrieving Title Details...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" id="detail-modal-error">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg max-w-sm text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--theme-primary)" }} />
          <p className="text-white font-bold">{error || "Failed to load movie info"}</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 text-white rounded text-xs font-semibold hover:brightness-110"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }

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

        {/* Hero Backdrop Backdrop */}
        <div className="relative aspect-video md:aspect-[21/9] w-full">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0b0b0d] via-[#0b0b0d]/42 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {movie.tier && movie.tier !== "free" && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded mr-2 uppercase ${
                  movie.tier === "premium" 
                    ? "bg-amber-500 text-black font-black" 
                    : "text-white"
                }`}
                style={movie.tier === "premium" ? undefined : { backgroundColor: "var(--theme-primary)" }}
                >
                  {movie.tier.toUpperCase()} VIP
                </span>
              )}
              <span className="px-2.5 py-0.5 text-[10px] font-black text-white rounded mr-2" style={{ backgroundColor: "var(--theme-primary)" }}>
                {movie.quality}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold bg-zinc-950/80 text-zinc-300 rounded border border-zinc-800">
                {movie.ageRating}
              </span>
              <h2 className="text-xl md:text-3xl font-black text-white mt-2 drop-shadow-md">
                {movie.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPlay(movie)}
                className="flex items-center gap-2 text-white font-bold text-xs px-5 py-2.5 rounded-md transition-colors shadow-lg cursor-pointer hover:brightness-110"
                style={{ backgroundColor: "var(--theme-primary)", boxShadow: "0 14px 30px var(--theme-primary-20)" }}
                id="modal-play-btn"
              >
                <Play className="w-4 h-4 fill-white" />
                Stream Now
              </button>

              <button
                onClick={() => onToggleFavorite(movie.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
                  isFavorite(movie.id)
                    ? ""
                    : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
                style={isFavorite(movie.id) ? { backgroundColor: "var(--theme-primary-10)", borderColor: "var(--theme-primary-50)", color: "var(--theme-primary)" } : {}}
                title="Add to Watchlist"
                id="modal-fav-btn"
              >
                <Heart className={`w-4 h-4 ${isFavorite(movie.id) ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Body Grid */}
        <div className="p-6 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Summary and Review Board */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-zinc-400 text-xs font-bold tracking-wider uppercase mb-2">Synopsis</h3>
              <p className="text-zinc-200 text-sm leading-relaxed">{movie.description}</p>
            </div>

            {/* Subtitles & Playback Info */}
            {movie.subtitles.length > 0 && (
              <div>
                <h3 className="text-zinc-400 text-xs font-bold tracking-wider uppercase mb-2">Available Subtitles</h3>
                <div className="flex flex-wrap gap-1.5">
                  {movie.subtitles.map((sub) => (
                    <span 
                      key={sub.id} 
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded font-mono"
                    >
                      CC: {sub.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Episodes Explorer for TV Series */}
            {movie.contentType === "series" && movie.seasons && movie.seasons.length > 0 && (
              <div className="border-t border-zinc-800/80 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-white text-sm font-black flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" />
                    Browse Episodes
                  </h3>
                  
                  {/* Season selector pills */}
                  <div className="flex gap-1.5 overflow-x-auto max-w-full sm:max-w-md scrollbar-none pb-1 sm:pb-0">
                    {movie.seasons.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveModalSeason(s)}
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 cursor-pointer transition-all ${
                          activeModalSeason?.id === s.id
                            ? "bg-red-600 text-white shadow-md shadow-red-600/15"
                            : "bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-850"
                        }`}
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
                      className="bg-zinc-950/40 border border-zinc-900/80 p-3 rounded-lg flex gap-4 hover:border-zinc-800 transition-all group"
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
                          onClick={() => onPlay(movie)}
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
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-red-500 transition-colors">{ep.title}</span>
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
            <div className="border-t border-zinc-800/80 pt-6">
              <h3 className="text-white text-base font-bold flex items-center gap-2 mb-4">
                <MessageSquare className="w-4.5 h-4.5 text-red-500" />
                Community Reviews ({reviews.length})
              </h3>

              {/* Review Submit Form */}
              {currentUser ? (
                <form onSubmit={handleSubmitReview} className="bg-zinc-950/60 p-4 rounded-lg border border-zinc-800/50 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-semibold">Write a Review</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 font-medium">Your Rating:</span>
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
                    placeholder="Provide your feedback for this title..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white rounded focus:outline-hidden focus:border-red-500/50"
                    id="review-comment-textarea"
                  />

                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-medium ${
                      reviewMessage.includes("success") ? "text-emerald-500" : "text-amber-500"
                    }`}>{reviewMessage}</p>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded transition-all cursor-pointer"
                      id="review-submit-btn"
                    >
                      <Send className="w-3 h-3" />
                      {submittingReview ? "Posting..." : "Submit"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-zinc-950/30 p-3 rounded border border-dashed border-zinc-800 text-center mb-6">
                  <p className="text-xs text-zinc-500">
                    Please <span className="text-red-500 font-semibold">Login / Sign In</span> to post reviews.
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1" id="reviews-list">
                {reviews.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No reviews yet. Be the first to express opinion!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/80 space-y-2">
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
          </div>

          {/* Right Column: Metadata Cards */}
          <div className="space-y-4">
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <div className="text-xs">
                  <p className="font-bold text-white text-sm">{movie.rating} / 10</p>
                  <p className="text-[10px] text-zinc-500">Aggregate Rating</p>
                </div>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Release Year</span>
                <span className="font-bold text-zinc-200">{movie.releaseYear}</span>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{movie.contentType === "series" ? "Total Seasons" : "Runtime"}</span>
                <span className="font-bold text-zinc-200">
                  {movie.contentType === "series"
                    ? `${movie.seasons?.length || 0} ${movie.seasons?.length === 1 ? "Season" : "Seasons"}`
                    : `${movie.duration} minutes`}
                </span>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Total Stream Views</span>
                <span className="font-bold text-zinc-200">{movie.views.toLocaleString()}</span>
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Likes / Favorites</span>
                <span className="font-bold text-zinc-200">{movie.likes.toLocaleString()}</span>
              </div>
            </div>

            {/* Crew / Cast details */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 space-y-3.5">
              <div>
                <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Directing Crew
                </p>
                <p className="text-xs text-zinc-200 font-medium pl-5">
                  {movie.directors.join(", ") || "Unknown"}
                </p>
              </div>

              <div className="border-t border-zinc-900/60 pt-3">
                <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Film className="w-3.5 h-3.5" /> Starring Cast
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
                  <Globe className="w-3.5 h-3.5" /> Origins
                </p>
                <div className="text-xs text-zinc-300 pl-5 space-y-1">
                  <p>Country: <span className="text-white font-medium">{movie.country}</span></p>
                  <p>Audio: <span className="text-white font-medium">{movie.language}</span></p>
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
              More Like This
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
