/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Film, Heart, AlertTriangle, Play, Sparkles, Filter, 
  ArrowUpDown, ListVideo, HelpCircle, Flame, Compass 
} from "lucide-react";
import Header from "./components/Header";
import MovieCard from "./components/MovieCard";
import MovieCarousel from "./components/MovieCarousel";
import MovieDetailModal from "./components/MovieDetailModal";
import MediaPlayer from "./components/MediaPlayer";
import AdminCMS from "./components/AdminCMS";
import AuthModal from "./components/AuthModal";
import { Movie, User, WatchHistoryItem, CMSSettings } from "./types";

export default function App() {
  // Authentication & Configuration State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<CMSSettings>({
    siteName: "FlixSphere",
    logoText: "FLIXSPHERE",
    primaryColor: "#E50914",
    enableComments: true,
    enableRatings: true,
    maintenanceMode: false,
    seoTitle: "FlixSphere",
    seoDescription: "",
    seoKeywords: ""
  });

  // UI Control Router State
  const [activeTab, setActiveTab] = useState<string>("home"); // home, favorites, admin
  const [showAuth, setShowAuth] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeStream, setActiveStream] = useState<Movie | null>(null);

  // Catalog, Search, Filters
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  
  // User Personalization Lists
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchHistory, setWatchHistory] = useState<(WatchHistoryItem & { movie: Movie })[]>([]);
  
  // App Loading / States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // APIS / FETCH CONTROLLERS
  // ==========================================

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.warn("Failed fetching settings:", e);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.warn("Auth session fetch error:", e);
    }
  };

  const fetchCatalogMovies = async () => {
    try {
      setLoading(true);
      setError("");
      
      const queryParams = new URLSearchParams();
      if (selectedGenre && selectedGenre !== "All") queryParams.append("genre", selectedGenre);
      if (searchQuery) queryParams.append("search", searchQuery);
      if (sortBy) queryParams.append("sortBy", sortBy);

      const res = await fetch(`/api/movies?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Could not retrieve catalog titles.");
      
      const data = await res.json();
      setMovies(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred loading movies.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPersonalization = async () => {
    if (!currentUser) {
      setFavorites([]);
      setWatchHistory([]);
      return;
    }

    try {
      // Favorites list
      const favRes = await fetch("/api/user/favorites");
      if (favRes.ok) {
        const favData = await favRes.json();
        setFavorites(favData);
      }

      // History / Resume Points list
      const histRes = await fetch("/api/user/history");
      if (histRes.ok) {
        const histData = await histRes.json();
        setWatchHistory(histData);
      }
    } catch (e) {
      console.warn("Failed syncing user lists:", e);
    }
  };

  // Lifecycle boot synchronization
  useEffect(() => {
    fetchGlobalSettings();
    fetchSession();
  }, []);

  // Sync catalog whenever filtering/sorting shifts
  useEffect(() => {
    fetchCatalogMovies();
  }, [selectedGenre, searchQuery, sortBy]);

  // Sync user watchlist whenever user logs in, logs out, or views refresh
  useEffect(() => {
    fetchUserPersonalization();
  }, [currentUser]);

  // ==========================================
  // INTERACTION FLOW ACTIONS
  // ==========================================

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab("home");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setActiveTab("home");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // Interactive role-bypass controller for marketplace simulation
  const handleToggleTestingRole = async () => {
    try {
      const res = await fetch("/api/auth/toggle-role", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        
        // Return user to home tab if they demote themselves out of admin CMS
        if (data.user.role !== "admin" && activeTab === "admin") {
          setActiveTab("home");
        }
      }
    } catch (err) {
      console.error("Testing toggle error:", err);
    }
  };

  const handleToggleFavorite = async (movieId: string) => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    const isFav = favorites.some((m) => m.id === movieId);
    const method = isFav ? "DELETE" : "POST";
    const url = isFav ? `/api/user/favorites/${movieId}` : "/api/user/favorites";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: isFav ? undefined : JSON.stringify({ movieId })
      });

      if (res.ok) {
        // Refetch watchlist
        fetchUserPersonalization();
        // Update local likes counts dynamically in movie lists if matches
        setMovies((prev) => 
          prev.map((mov) => {
            if (mov.id === movieId) {
              return { ...mov, likes: isFav ? Math.max(0, mov.likes - 1) : mov.likes + 1 };
            }
            return mov;
          })
        );
        if (selectedMovie && selectedMovie.id === movieId) {
          setSelectedMovie((prev) => prev ? {
            ...prev,
            likes: isFav ? Math.max(0, prev.likes - 1) : prev.likes + 1
          } : null);
        }
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  const handleLaunchStream = (movie: Movie) => {
    setSelectedMovie(null); // close details modal
    setActiveStream(movie); // open player
  };

  const handleCloseStream = () => {
    setActiveStream(null);
    // Reload history to reflect saved resume checkpoints
    fetchUserPersonalization();
  };

  const isFavorite = (movieId: string) => {
    return favorites.some((m) => m.id === movieId);
  };

  // Get matching progress for a film
  const getProgressOfMovie = (movieId: string) => {
    const item = watchHistory.find((h) => h.movieId === movieId);
    if (item) return { progress: item.progress, duration: item.duration };
    return undefined;
  };

  const bannerMovies = movies.filter((m) => m.isBanner);
  const featuredMovies = movies.filter((m) => m.isFeatured);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white relative overflow-x-hidden" id="app-root">
      {/* Header component */}
      <Header
        currentUser={currentUser}
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onToggleRole={handleToggleTestingRole}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container Viewport switch */}
      <main className="flex-1 pb-16">
        {settings.maintenanceMode && currentUser?.role !== "admin" ? (
          /* System Maintenance Gate Screen */
          <div className="max-w-md mx-auto text-center py-24 px-6 space-y-4" id="maintenance-gate-viewport">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">FlixSphere is Offline</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              We are currently carrying out system upgrades on databases. Only administrators are allowed inside the console dashboard.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded shadow-lg shadow-red-600/10 cursor-pointer"
              >
                Sign In as Admin
              </button>
            </div>
          </div>
        ) : activeTab === "admin" && currentUser?.role === "admin" ? (
          /* CMS ADMINISTRATOR PANEL */
          <AdminCMS 
            movies={movies} 
            onRefreshMovies={fetchCatalogMovies} 
          />
        ) : activeTab === "favorites" ? (
          /* MY FAVORITE WATCHLIST FEED */
          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" id="favorites-feed-viewport">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                My Watchlist ({favorites.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Your pinned catalog list. Click details to check cast, post ratings or resume saved streams.
              </p>
            </div>

            {favorites.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-zinc-900 rounded-xl space-y-3 bg-zinc-950/30">
                <p className="text-xs text-zinc-500">Your Watchlist is currently empty.</p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="bg-red-600/10 text-red-500 border border-red-500/20 text-xs font-semibold px-4 py-2 rounded-md hover:bg-red-600/20 transition-all cursor-pointer"
                >
                  Explore Spotlight Gallery
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    progress={getProgressOfMovie(movie.id)}
                    onSelect={setSelectedMovie}
                    onPlay={handleLaunchStream}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* HOME SPOTLIGHT OR MOVIE BROWSE SYSTEM */
          <div id="home-feed-viewport" className="space-y-8">
            {/* Spotlight Banner carousel - skip if searching */}
            {!searchQuery && bannerMovies.length > 0 && (
              <MovieCarousel
                bannerMovies={bannerMovies}
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
                onSelect={setSelectedMovie}
                onPlay={handleLaunchStream}
              />
            )}

            {/* Quick Filter Tag categories Row */}
            <div className="px-4 md:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 bg-zinc-950 rounded-xl border border-zinc-900/60 shadow-lg">
              {/* Genre tabs */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
                <Compass className="w-4 h-4 text-zinc-400 shrink-0 hidden md:inline" />
                {["All", "Action", "Animation", "Drama", "Fantasy", "Sci-Fi", "Comedy"].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                      selectedGenre === genre
                        ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                        : "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Sorting selectors */}
              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort By:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 px-3 py-1.5 rounded-md focus:outline-hidden focus:border-red-500/50"
                  id="sort-select"
                >
                  <option value="recent">Recently Published</option>
                  <option value="rating">Audience Score</option>
                  <option value="year">Release Calendar</option>
                  <option value="views">Total Views</option>
                </select>
              </div>
            </div>

            {/* CURATED MAIN PANELS */}
            <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
              {/* 1. Continue Watching Reel (Personalized watch history) */}
              {currentUser && watchHistory.length > 0 && !searchQuery && (
                <div className="space-y-4" id="continue-watching-section">
                  <div className="flex items-center gap-2">
                    <ListVideo className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-extrabold text-white">Continue Watching</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {watchHistory.map((hist) => (
                      <MovieCard
                        key={hist.movieId}
                        movie={hist.movie}
                        progress={{ progress: hist.progress, duration: hist.duration }}
                        onSelect={setSelectedMovie}
                        onPlay={() => handleLaunchStream(hist.movie)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Main Selected Grid */}
              <div className="space-y-4" id="main-catalog-grid">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">
                      {selectedGenre === "All" ? "Trending Cinema Catalog" : `${selectedGenre} Spotlight`}
                    </h2>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
                    {movies.length} Results
                  </span>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center gap-2" id="grid-loading">
                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500">Querying FlixSphere indexes...</span>
                  </div>
                ) : error ? (
                  <div className="py-14 text-center text-red-400 text-xs border border-zinc-900 rounded-xl">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    {error}
                  </div>
                ) : movies.length === 0 ? (
                  <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-xl bg-zinc-950/20">
                    No cinematic titles match the active criteria. Try choosing another filter tag.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {movies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        progress={getProgressOfMovie(movie.id)}
                        onSelect={setSelectedMovie}
                        onPlay={handleLaunchStream}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Featured Row (Only if no active filter tag/search query) */}
              {!searchQuery && selectedGenre === "All" && featuredMovies.length > 0 && (
                <div className="space-y-4 border-t border-zinc-900/60 pt-8" id="featured-curations-section">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-extrabold text-white">Featured Selections</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {featuredMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        progress={getProgressOfMovie(movie.id)}
                        onSelect={setSelectedMovie}
                        onPlay={handleLaunchStream}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* OVERLAY: 1. Auth Modals Card */}
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onSuccess={handleAuthSuccess} 
        />
      )}

      {/* OVERLAY: 2. Movie Details dialog drawer */}
      {selectedMovie && (
        <MovieDetailModal
          movieId={selectedMovie.id}
          currentUser={currentUser}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelectedMovie(null)}
          onPlay={handleLaunchStream}
        />
      )}

      {/* OVERLAY: 3. Dynamic MediaPlayer Screen */}
      {activeStream && (
        <MediaPlayer
          movie={activeStream}
          initialProgress={getProgressOfMovie(activeStream.id)?.progress || 0}
          onClose={handleCloseStream}
        />
      )}

      {/* Footer copyright */}
      <footer className="border-t border-zinc-900/80 bg-black/90 py-8 px-4 text-center text-zinc-600 text-xs mt-auto">
        <p>© 2026 {settings.siteName} SaaS Platform. All Rights Reserved.</p>
        <p className="text-[10px] text-zinc-700 mt-1 font-mono">
          Marketplace Presentation Model • Port 3000 Container Proxy Ingress Route
        </p>
      </footer>
    </div>
  );
}
