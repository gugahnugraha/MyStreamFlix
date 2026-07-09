/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Film, Heart, AlertTriangle, Play, Sparkles, Filter, 
  ArrowUpDown, ListVideo, HelpCircle, Flame, Compass, Tv, Clapperboard
} from "lucide-react";
import Header from "./components/Header";
import MovieCard from "./components/MovieCard";
import MovieCarousel from "./components/MovieCarousel";
import MovieRow from "./components/MovieRow";
import MovieDetailModal from "./components/MovieDetailModal";
import MediaPlayer from "./components/MediaPlayer";
import AdminCMS from "./components/AdminCMS";
import AuthModal from "./components/AuthModal";
import SubscriptionModal from "./components/SubscriptionModal";
import ProfileModal from "./components/ProfileModal";
import { Movie, User, WatchHistoryItem, CMSSettings } from "./types";
import { getTranslation, LanguageCode } from "./translations";

export default function App() {
  // Language Localization State
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("en");

  // Load language preference on client mount
  useEffect(() => {
    const saved = localStorage.getItem("app_lang");
    if (saved === "en" || saved === "id" || saved === "es") {
      setCurrentLanguage(saved as LanguageCode);
    }
  }, []);
  const t = getTranslation(currentLanguage);

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem("app_lang", lang);
  };

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
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  // Catalog, Search, Filters
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedContentType, setSelectedContentType] = useState<"all" | "movie" | "series">("all");
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
      if (selectedContentType && selectedContentType !== "all") queryParams.append("contentType", selectedContentType);
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
  }, [selectedGenre, searchQuery, sortBy, selectedContentType]);

  // Sync user watchlist whenever user logs in, logs out, or views refresh
  useEffect(() => {
    fetchUserPersonalization();
  }, [currentUser]);

  // Revert settings if leaving admin mode without saving
  useEffect(() => {
    if (activeTab !== "admin") {
      fetchGlobalSettings();
    }
  }, [activeTab]);


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
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    if (movie.tier && movie.tier !== "free" && !currentUser.isPremium) {
      setShowSubscription(true);
      return;
    }

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

  // Kids Mode content filters matching active profile rating
  const activeProfile = currentUser?.profiles?.find((p) => p.id === currentUser.activeProfileId);
  const isKidsMode = activeProfile?.isKids === true;

  const isKidsFriendly = (m: Movie) => {
    const isSafeRating = m.ageRating === "G" || m.ageRating === "PG" || m.ageRating === "Kids";
    const isSafeGenre = m.genres.some((g) => ["Animation", "Family", "Comedy"].includes(g));
    return isSafeRating || isSafeGenre;
  };

  const displayedMovies = isKidsMode ? movies.filter(isKidsFriendly) : movies;
  const bannerMovies = displayedMovies.filter((m) => m.isBanner);
  const featuredMovies = displayedMovies.filter((m) => m.isFeatured);
  const displayedFavorites = isKidsMode ? favorites.filter(isKidsFriendly) : favorites;
  const displayedWatchHistory = isKidsMode 
    ? watchHistory.filter((h) => isKidsFriendly(h.movie)) 
    : watchHistory;

  // Apply dynamic theme color to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', settings.primaryColor);
    // Dynamically calculate RGBA versions
    const color = settings.primaryColor;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    root.style.setProperty('--theme-primary-90', `rgba(${r}, ${g}, ${b}, 0.9)`);
    root.style.setProperty('--theme-primary-80', `rgba(${r}, ${g}, ${b}, 0.8)`);
    root.style.setProperty('--theme-primary-50', `rgba(${r}, ${g}, ${b}, 0.5)`);
    root.style.setProperty('--theme-primary-30', `rgba(${r}, ${g}, ${b}, 0.3)`);
    root.style.setProperty('--theme-primary-20', `rgba(${r}, ${g}, ${b}, 0.2)`);
    root.style.setProperty('--theme-primary-10', `rgba(${r}, ${g}, ${b}, 0.1)`);
  }, [settings.primaryColor]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:text-white relative overflow-x-hidden pt-[65px]" id="app-root" style={{ ["selectionBackgroundColor" as any]: settings.primaryColor }}>

      {/* Header component */}
      <Header
        currentUser={currentUser}
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedContentType={selectedContentType}
        onSelectContentType={setSelectedContentType}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onToggleRole={handleToggleTestingRole}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSubscription={() => setShowSubscription(true)}
        onOpenProfileSwitcher={() => setShowProfileSwitcher(true)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        t={t}
        movies={displayedMovies}
      />

      {/* Main Container Viewport switch */}
      <main className="flex-1 pb-16">
        {settings.maintenanceMode && currentUser?.role !== "admin" ? (
          /* System Maintenance Gate Screen */
          <div className="max-w-md mx-auto text-center py-24 px-6 space-y-4" id="maintenance-gate-viewport">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">{t.offlineGateTitle}</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {t.offlineGateDesc}
            </p>
            <div className="pt-4">
              <button 
                onClick={() => setShowAuth(true)}
                className="text-white font-bold text-xs px-5 py-2.5 rounded shadow-lg cursor-pointer hover:opacity-90 transition-all"
                style={{ backgroundColor: settings.primaryColor, boxShadow: `0 0 15px ${settings.primaryColor}30` }}
              >
                {t.signInAsAdmin}
              </button>
            </div>
          </div>
        ) : activeTab === "admin" && currentUser?.role === "admin" ? (
          /* CMS ADMINISTRATOR PANEL */
          <AdminCMS 
            movies={movies} 
            onRefreshMovies={fetchCatalogMovies} 
            globalSettings={settings}
            onUpdateGlobalSettings={setSettings}
          />
        ) : activeTab === "favorites" ? (
          /* MY FAVORITE WATCHLIST FEED */
          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" id="favorites-feed-viewport">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 fill-current" style={{ color: settings.primaryColor }} />
                {t.myWatchlistTitle} ({displayedFavorites.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {t.myWatchlistDesc}
              </p>
            </div>

            {displayedFavorites.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-zinc-900 rounded-xl space-y-3 bg-zinc-950/30">
                <p className="text-xs text-zinc-500">{t.watchlistEmpty}</p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="text-xs font-semibold px-4 py-2 rounded-md transition-all cursor-pointer border"
                  style={{ backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor, borderColor: `${settings.primaryColor}40` }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${settings.primaryColor}20`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${settings.primaryColor}10`)}
                >
                  {t.exploreSpotlight}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedFavorites.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    progress={getProgressOfMovie(movie.id)}
                    onSelect={setSelectedMovie}
                    onPlay={handleLaunchStream}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* HOME SPOTLIGHT OR MOVIE BROWSE SYSTEM */
          <div id="home-feed-viewport" className="space-y-8">
            {/* If searching, show search results grid instead of category rows */}
            {searchQuery ? (
              <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-6 pb-16 pt-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl font-extrabold tracking-tight">{(t.searchResultsFor || "Search Results for")} "{searchQuery}"</h2>
                  <span className="text-xs text-zinc-500 font-mono">{displayedMovies.length} {(t.found || "found")}</span>
                </div>
                {displayedMovies.length === 0 ? (
                  <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-xl bg-zinc-950/20">
                    {t.noMatchingContentDesc}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {displayedMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        progress={getProgressOfMovie(movie.id)}
                        onSelect={setSelectedMovie}
                        onPlay={handleLaunchStream}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : selectedContentType === "all" ? (
              /* HOME VIEW: CATEGORIES & Snapping horizontal scroll sliders */
              <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-12 pb-16 pt-6 animate-fade-in-quick">
                
                {/* Hero Widescreen Carousel */}
                {bannerMovies.length > 0 && (
                  <div className="w-full">
                    <MovieCarousel
                      bannerMovies={bannerMovies}
                      isFavorite={isFavorite}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={setSelectedMovie}
                      onPlay={handleLaunchStream}
                      t={t}
                    />
                  </div>
                )}

                {/* 1. Continue Watching Reel */}
                {currentUser && displayedWatchHistory.length > 0 && (
                  <MovieRow
                    title={t.continueWatching}
                    icon={<ListVideo className="w-5 h-5" style={{ color: settings.primaryColor }} />}
                    items={displayedWatchHistory.map((hist) => ({
                      movie: hist.movie,
                      progress: { progress: hist.progress, duration: hist.duration }
                    }))}
                    onSelect={setSelectedMovie}
                    onPlay={(movie) => handleLaunchStream(movie)}
                    t={t}
                  />
                )}

                {/* 2. Featured Spotlight Slider */}
                {featuredMovies.length > 0 && (
                  <MovieRow
                    title={t.featuredSpotlight || "Featured Spotlight"}
                    icon={<Sparkles className="w-5 h-5 text-amber-500" />}
                    items={featuredMovies.map((movie) => ({
                      movie,
                      progress: getProgressOfMovie(movie.id)
                    }))}
                    onSelect={setSelectedMovie}
                    onPlay={handleLaunchStream}
                    t={t}
                  />
                )}

                {/* 3. Popular Hits */}
                {displayedMovies.length > 0 && (
                  <MovieRow
                    title={t.popularHits || "Popular Hits"}
                    icon={<Flame className="w-5 h-5 text-orange-500" />}
                    items={[...displayedMovies]
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 10)
                      .map((movie) => ({
                        movie,
                        progress: getProgressOfMovie(movie.id)
                      }))}
                    onSelect={setSelectedMovie}
                    onPlay={handleLaunchStream}
                    t={t}
                  />
                )}

                {/* 4. New Releases */}
                {displayedMovies.length > 0 && (
                  <MovieRow
                    title={t.newReleases || "New Releases"}
                    icon={<Film className="w-5 h-5" style={{ color: settings.primaryColor }} />}
                    items={[...displayedMovies]
                      .sort((a, b) => b.releaseYear - a.releaseYear)
                      .slice(0, 10)
                      .map((movie) => ({
                        movie,
                        progress: getProgressOfMovie(movie.id)
                      }))}
                    onSelect={setSelectedMovie}
                    onPlay={handleLaunchStream}
                    t={t}
                  />
                )}
                
              </div>
            ) : (
              /* DEDICATED CATALOG VIEW FOR MOVIES / TV SERIES (NO CAROUSEL) */
              <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-10 pb-16 pt-6 animate-fade-in-quick">
                
                {/* Immersive Tagline Header instead of Carousel */}
                <div className="apple-header-panel py-10 px-8 rounded-3xl shadow-3xl relative overflow-hidden">
                  <div className="apple-header-glow" style={{ background: `radial-gradient(circle, var(--theme-primary-30) 0%, transparent 70%)` }} />
                  <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10" style={{ color: settings.primaryColor }}>
                    {selectedContentType === "movie" ? (t.moviesCatalog || "Movies Catalog") : (t.tvSeriesCollections || "TV Series Collections")}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-4 drop-shadow-md">
                    {selectedContentType === "movie" ? (t.premiumCinemaExperience || "Premium Cinema Experience") : (t.episodicSeriesMasterpieces || "Episodic Series Masterpieces")}
                  </h1>
                  <p className="text-xs md:text-sm text-zinc-300 max-w-2xl mt-3 font-medium leading-relaxed drop-shadow-xs">
                    {selectedContentType === "movie" 
                      ? (t.moviesCatalogDesc || "Explore our handpicked curation of blockbusters, documentaries, and animations in cinematic 4K HDR quality with offline localization.")
                      : (t.tvSeriesCatalogDesc || "Engage with stunning multi-season storytelling structures, featuring sequential play, subtitle overlays, and resume capabilities.")}
                  </p>
                </div>
 
                {/* Quick Filters Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md shadow-lg">
                  {/* Genre filters */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
                    <Compass className="w-4 h-4 shrink-0 hidden md:inline animate-spin-slow" style={{ color: settings.primaryColor }} />
                    {["All", "Action", "Animation", "Drama", "Fantasy", "Sci-Fi", "Comedy"].map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`glass-pill px-4 py-2 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                          selectedGenre === genre ? "active" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t[genre as keyof typeof t] || genre}
                      </button>
                    ))}
                  </div>
 
                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>{t.sortBy}</span>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="glass-select text-xs font-extrabold focus:outline-hidden focus:ring-1 focus:ring-white/20"
                      id="sort-select"
                    >
                      <option value="recent" className="bg-zinc-950 text-white">{t.recentlyPublished}</option>
                      <option value="rating" className="bg-zinc-950 text-white">{t.audienceScore}</option>
                      <option value="year" className="bg-zinc-950 text-white">{t.releaseCalendar}</option>
                      <option value="views" className="bg-zinc-950 text-white">{t.totalViewsLabel}</option>
                    </select>
                  </div>
                </div>
 
                {/* Grid Content */}
                <div className="space-y-4" id="main-catalog-grid">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 px-1">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5" style={{ color: settings.primaryColor }} />
                      <h2 className="text-lg font-bold tracking-tight text-white/95">
                        {selectedGenre === "All" ? (t.spotlightCuration || "Spotlight Curation") : `${t[selectedGenre as keyof typeof t] || selectedGenre} Curation`}
                      </h2>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
                      {displayedMovies.length} {selectedContentType === "movie" ? t.movies : t.tvSeries}
                    </span>
                  </div>
 
                  {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3" id="grid-loading">
                      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: settings.primaryColor, borderTopColor: "transparent" }} />
                      <span className="text-xs text-zinc-500 font-medium">{t.queryingDatabase || "Querying FlixSphere database indexes..."}</span>
                    </div>
                  ) : error ? (
                    <div className="py-14 text-center text-red-400 text-xs border border-zinc-900 rounded-xl">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                      {error}
                    </div>
                  ) : displayedMovies.length === 0 ? (
                    <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-900/60 rounded-xl bg-zinc-950/20">
                      {t.noMatchingContentDesc}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                      {displayedMovies.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          progress={getProgressOfMovie(movie.id)}
                          onSelect={setSelectedMovie}
                          onPlay={handleLaunchStream}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* OVERLAY: 1. Auth Modals Card */}
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onSuccess={handleAuthSuccess} 
          t={t}
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
          t={t}
        />
      )}

      {/* OVERLAY: 3. Dynamic MediaPlayer Screen */}
      {activeStream && (
        <MediaPlayer
          movie={activeStream}
          initialProgress={getProgressOfMovie(activeStream.id)?.progress || 0}
          onClose={handleCloseStream}
          t={t}
        />
      )}

      {/* OVERLAY: 4. VIP Subscription Checkout Paywall */}
      {showSubscription && (
        <SubscriptionModal
          currentUser={currentUser}
          onClose={() => setShowSubscription(false)}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setShowSubscription(false);
          }}
          t={t}
        />
      )}

      {/* OVERLAY: 5. Profiles Switcher & Creation Drawer */}
      {showProfileSwitcher && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfileSwitcher(false)}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setShowProfileSwitcher(false);
            // Refresh list contents and filters contextually
            fetchCatalogMovies();
            fetchUserPersonalization();
          }}
          t={t}
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
