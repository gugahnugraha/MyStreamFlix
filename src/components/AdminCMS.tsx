/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, Film, Settings, Plus, Edit, Trash2, Save, 
  Tv, Eye, Play, ShieldAlert, CheckCircle, TrendingUp, Users, RefreshCw, X, Search, Database 
} from "lucide-react";
import { Movie, DashboardStats, CMSSettings, Subtitle, User, Season, Episode } from "../types";

interface AdminCMSProps {
  onRefreshMovies: () => void;
  movies: Movie[];
  globalSettings: CMSSettings;
  onUpdateGlobalSettings: (settings: CMSSettings) => void;
  t: any;
}

const PRESET_COLORS = [
  { name: "Flix Red", value: "#E50914" },
  { name: "Royal Blue", value: "#007AFF" },
  { name: "Apple Purple", value: "#AF52DE" },
  { name: "Vibrant Pink", value: "#FF2D55" },
  { name: "Sunset Orange", value: "#FF9500" },
  { name: "Forest Green", value: "#34C759" },
  { name: "Neon Teal", value: "#00C7BE" }
];

type TmdbSearchResult = {
  id: string;
  tmdbId: number;
  type: "movie" | "series";
  title: string;
  subtitle: string;
  posterUrl?: string;
  backdropUrl?: string;
  alreadyImported?: boolean;
  existingMovieId?: string;
};

type TmdbMetadata = {
  tmdbId: number;
  tmdbMediaType: "movie" | "tv";
  contentType: "movie" | "series";
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  duration: number;
  releaseYear: number;
  rating: number;
  ageRating: string;
  genres: string[];
  cast: string[];
  directors: string[];
  country: string;
  language: string;
  seasonsCount: number;
  episodesPerSeason: number;
  seasons: Season[];
};

export default function AdminCMS({ 
  onRefreshMovies, 
  movies, 
  globalSettings, 
  onUpdateGlobalSettings,
  t
}: AdminCMSProps) {
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "catalog" | "settings" | "users">("analytics");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<CMSSettings | null>(globalSettings || null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync settings state with prop
  useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
    }
  }, [globalSettings]);

  // Update a single settings field in real-time
  const updateSettingsField = (key: keyof CMSSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateGlobalSettings(newSettings);
  };

  // Get brand color from settings when loaded
  const brandColor = settings?.primaryColor || "#E50914";

  // Catalog Filter / Sort States
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilterType, setCatalogFilterType] = useState<"all" | "movie" | "series">("all");
  const [catalogSortBy, setCatalogSortBy] = useState<string>("recent");

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    // 1. Filter by content type
    if (catalogFilterType !== "all") {
      result = result.filter(m => m.contentType === catalogFilterType);
    }

    // 2. Filter by search query
    const q = catalogSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) || 
        (m.genres || []).some(g => g.toLowerCase().includes(q)) ||
        (m.directors || []).some(d => d.toLowerCase().includes(q)) ||
        (m.cast || []).some(c => c.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (catalogSortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "year-desc":
          return b.releaseYear - a.releaseYear;
        case "year-asc":
          return a.releaseYear - b.releaseYear;
        case "views-desc":
          return b.views - a.views;
        case "likes-desc":
          return b.likes - a.likes;
        case "recent":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return result;
  }, [movies, catalogFilterType, catalogSearch, catalogSortBy]);

  // Edit / Create Form States
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | undefined>(undefined);
  const [selectedTmdbMediaType, setSelectedTmdbMediaType] = useState<"movie" | "tv" | undefined>(undefined);
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState("");
  const [applyingTmdbId, setApplyingTmdbId] = useState<number | null>(null);

  // Form Inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(120);
  const [releaseYear, setReleaseYear] = useState(2024);
  const [rating, setRating] = useState(8.0);
  const [ageRating, setAgeRating] = useState("PG-13");
  const [quality, setQuality] = useState<"4K" | "Ultra HD" | "Full HD" | "HD">("Full HD");
  const [genres, setGenres] = useState<string[]>([]);
  const [cast, setCast] = useState<string[]>([]);
  const [directors, setDirectors] = useState<string[]>([]);
  const [country, setCountry] = useState("United States");
  const [language, setLanguage] = useState("English");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBanner, setIsBanner] = useState(false);

  // Content type and series configurations states
  const [contentType, setContentType] = useState<"movie" | "series">("movie");
  const [seasonsCount, setSeasonsCount] = useState(1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState(5);
  const [seasons, setSeasons] = useState<Season[]>([]);

  // Helpers to manage seasons and episodes
  const handleAddSeason = () => {
    const nextSeasonNum = seasons.length + 1;
    const newSeason: Season = {
      id: `sea-${Date.now()}`,
      seasonNumber: nextSeasonNum,
      title: `Season ${nextSeasonNum}`,
      episodes: [
        {
          id: `ep-${Date.now()}-1`,
          episodeNumber: 1,
          title: "Episode 1: Pilot",
          duration: 45,
          videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          description: "An exciting introduction to the characters and the plot."
        }
      ]
    };
    setSeasons([...seasons, newSeason]);
  };

  const handleRemoveSeason = (seasonId: string) => {
    setSeasons(seasons.filter(s => s.id !== seasonId).map((s, idx) => ({
      ...s,
      seasonNumber: idx + 1,
      title: `Season ${idx + 1}`
    })));
  };

  const handleUpdateSeasonTitle = (seasonId: string, title: string) => {
    setSeasons(seasons.map(s => s.id === seasonId ? { ...s, title } : s));
  };

  const handleAddEpisode = (seasonId: string) => {
    setSeasons(seasons.map(s => {
      if (s.id !== seasonId) return s;
      const nextEpNum = s.episodes.length + 1;
      return {
        ...s,
        episodes: [
          ...s.episodes,
          {
            id: `ep-${Date.now()}-${nextEpNum}`,
            episodeNumber: nextEpNum,
            title: `Episode ${nextEpNum}: The Journey Continues`,
            duration: 45,
            videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            description: "A continuation of the epic adventures with new challenges."
          }
        ]
      };
    }));
  };

  const handleRemoveEpisode = (seasonId: string, episodeId: string) => {
    setSeasons(seasons.map(s => {
      if (s.id !== seasonId) return s;
      return {
        ...s,
        episodes: s.episodes.filter(e => e.id !== episodeId).map((e, idx) => ({
          ...e,
          episodeNumber: idx + 1
        }))
      };
    }));
  };

  const handleUpdateEpisode = (seasonId: string, episodeId: string, field: keyof Episode, value: any) => {
    setSeasons(seasons.map(s => {
      if (s.id !== seasonId) return s;
      return {
        ...s,
        episodes: s.episodes.map(e => {
          if (e.id !== episodeId) return e;
          return {
            ...e,
            [field]: value
          };
        })
      };
    }));
  };

  // Populate default seasons/episodes when changing to series
  useEffect(() => {
    if (contentType === "series" && seasons.length === 0) {
      setSeasons([
        {
          id: `sea-${Date.now()}-1`,
          seasonNumber: 1,
          title: "Season 1",
          episodes: [
            {
              id: `ep-${Date.now()}-1-1`,
              episodeNumber: 1,
              title: "Episode 1: Pilot",
              duration: 45,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              description: "The pilot episode introduces our characters and sets off the grand adventure."
            },
            {
              id: `ep-${Date.now()}-1-2`,
              episodeNumber: 2,
              title: "Episode 2: The Journey Begins",
              duration: 43,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              description: "Our characters set out on their quest, facing their first unexpected challenge."
            }
          ]
        }
      ]);
    }
  }, [contentType]);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const statsRes = await fetch("/api/dashboard/stats");
      if (!statsRes.ok) throw new Error("Could not fetch analytical stats.");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Settings are synchronized and updated in real-time through globalSettings props

      // Fetch active registered users from database
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching dashboard modules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [movies]); // re-run stats whenever catalog changes

  useEffect(() => {
    if (!showForm || tmdbQuery.trim().length < 2) {
      setTmdbResults([]);
      setTmdbError("");
      setTmdbLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setTmdbLoading(true);
      setTmdbError("");
      try {
        const params = new URLSearchParams({
          q: tmdbQuery.trim(),
          contentType: "all"
        });
        const res = await fetch(`/api/tmdb/search?${params.toString()}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "TMDB search failed.");
        setTmdbResults(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setTmdbResults([]);
          setTmdbError(err.message || "Could not reach TMDB.");
        }
      } finally {
        if (!controller.signal.aborted) setTmdbLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [showForm, tmdbQuery]);

  // Form field handlers
  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingMovieId(null);
    setTitle("");
    setDescription("");
    setPosterUrl("");
    setBackdropUrl("");
    setVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    setDuration(120);
    setReleaseYear(2024);
    setRating(7.5);
    setAgeRating("PG-13");
    setQuality("Full HD");
    setGenres(["Drama", "Sci-Fi"]);
    setCast(["Actor One", "Actor Two"]);
    setDirectors(["Director Name"]);
    setCountry("United States");
    setLanguage("English");
    setIsFeatured(false);
    setIsBanner(false);
    setContentType("movie");
    setSeasonsCount(1);
    setEpisodesPerSeason(5);
    setSeasons([]);
    setTmdbQuery("");
    setSelectedTmdbId(undefined);
    setSelectedTmdbMediaType(undefined);
    setTmdbResults([]);
    setTmdbError("");
    setShowForm(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setFormMode("edit");
    setEditingMovieId(movie.id);
    setTitle(movie.title);
    setDescription(movie.description);
    setPosterUrl(movie.posterUrl);
    setBackdropUrl(movie.backdropUrl);
    setVideoUrl(movie.videoUrl);
    setDuration(movie.duration);
    setReleaseYear(movie.releaseYear);
    setRating(movie.rating);
    setAgeRating(movie.ageRating);
    setQuality(movie.quality);
    setGenres(movie.genres);
    setCast(movie.cast);
    setDirectors(movie.directors);
    setCountry(movie.country);
    setLanguage(movie.language);
    setIsFeatured(movie.isFeatured);
    setIsBanner(movie.isBanner);
    setContentType(movie.contentType || "movie");
    setSeasonsCount(movie.seasons?.length || 1);
    setEpisodesPerSeason(movie.seasons?.[0]?.episodes?.length || 5);
    setSeasons(movie.seasons || []);
    setTmdbQuery(movie.title);
    setSelectedTmdbId(movie.tmdbId);
    setSelectedTmdbMediaType(movie.tmdbMediaType);
    setTmdbResults([]);
    setTmdbError("");
    setShowForm(true);
  };

  const applyTmdbMetadata = async (result: TmdbSearchResult) => {
    try {
      setApplyingTmdbId(result.tmdbId);
      setTmdbError("");
      const mediaType = result.type === "series" ? "tv" : "movie";
      const params = new URLSearchParams({
        id: String(result.tmdbId),
        mediaType
      });
      const res = await fetch(`/api/tmdb/metadata?${params.toString()}`);
      const metadata: TmdbMetadata | { error?: string } = await res.json();
      if (!res.ok) throw new Error((metadata as any).error || "Could not import TMDB metadata.");

      const data = metadata as TmdbMetadata;
      setSelectedTmdbId(data.tmdbId);
      setSelectedTmdbMediaType(data.tmdbMediaType);
      setContentType(data.contentType);
      setTitle(data.title || title);
      setTmdbQuery(data.title || result.title);
      setDescription(data.description || "");
      setPosterUrl(data.posterUrl || posterUrl);
      setBackdropUrl(data.backdropUrl || backdropUrl);
      setDuration(data.duration || duration);
      setReleaseYear(data.releaseYear || releaseYear);
      setRating(data.rating || rating);
      setAgeRating(data.ageRating || ageRating);
      setGenres(data.genres.length ? data.genres : genres);
      setCast(data.cast.length ? data.cast : cast);
      setDirectors(data.directors.length ? data.directors : directors);
      setCountry(data.country || country);
      setLanguage(data.language || language);
      setSeasonsCount(data.seasonsCount || 1);
      setEpisodesPerSeason(data.episodesPerSeason || 5);
      setSeasons(data.contentType === "series" ? data.seasons : []);
      setSuccessMsg(`TMDB metadata imported for ${data.title || result.title}.`);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setTmdbError(err.message || "TMDB import failed.");
    } finally {
      setApplyingTmdbId(null);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!window.confirm(t.cmsDeleteMovieConfirm)) return;
    try {
      const res = await fetch(`/api/movies/${movieId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t.cmsDeletedMovie);
      
      setSuccessMsg(t.cmsDeletedMovie);
      onRefreshMovies();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      alert(err.message || t.cmsFailedSave);
    }
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      alert(t.cmsTitleVideoRequired);
      return;
    }

    const seasonsPayload = contentType === "series" ? seasons : [];

    const payload = {
      tmdbId: selectedTmdbId,
      tmdbMediaType: selectedTmdbMediaType,
      title,
      description,
      posterUrl: posterUrl || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80",
      backdropUrl: backdropUrl || "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=1200&auto=format&fit=crop&q=80",
      videoUrl,
      duration,
      releaseYear,
      rating,
      ageRating,
      quality,
      genres,
      cast,
      directors,
      country,
      language,
      isFeatured,
      isBanner,
      contentType,
      seasons: seasonsPayload
    };

    try {
      const url = formMode === "create" ? "/api/movies" : `/api/movies/${editingMovieId}`;
      const method = formMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409) {
          throw new Error(errData.error || t.cmsTitleExists);
        }
        throw new Error(errData.error || t.cmsFailedSave);
      }

      setSuccessMsg(formMode === "create" ? t.cmsCreatedSuccess : t.cmsUpdatedSuccess);
      setShowForm(false);
      onRefreshMovies();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      alert(err.message || "Save operation failed.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (!res.ok) throw new Error(t.cmsSettingsSaved);
      setSuccessMsg(t.cmsSettingsSaved);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      alert(err.message || "Settings update failed.");
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: "admin" | "user") => {
    const targetRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user role.");
      }
      setSuccessMsg(t.cmsRoleToggled);
      setTimeout(() => setSuccessMsg(""), 3500);
      
      // Refresh user base list
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
    } catch (err: any) {
      alert(err.message || "Role shift failed.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t.cmsDeleteUserConfirm)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account.");
      }
      setSuccessMsg(t.cmsUserDeleted);
      setTimeout(() => setSuccessMsg(""), 3500);
      
      // Refresh user base list
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
    } catch (err: any) {
      alert(err.message || "User deletion failed.");
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-20 gap-3" id="cms-loading">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">{t.cmsSyncingDb}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-zinc-300" id="admin-cms-wrapper">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider font-mono">
              {t.cmsSystemConsole}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            {t.cmsPanelTitle}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.cmsPanelDesc}
          </p>
        </div>

        {/* Dashboard sub tabs controls */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900" id="cms-subtabs">
          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "analytics"
                ? "text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            style={activeSubTab === "analytics" ? { backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}40` } : {}}
            id="subtab-analytics"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {t.cmsTabAnalytics}
          </button>
          <button
            onClick={() => setActiveSubTab("catalog")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "catalog"
                ? "text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            style={activeSubTab === "catalog" ? { backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}40` } : {}}
            id="subtab-catalog"
          >
            <Film className="w-3.5 h-3.5" />
            {t.cmsTabCatalog}
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "settings"
                ? "text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            style={activeSubTab === "settings" ? { backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}40` } : {}}
            id="subtab-settings"
          >
            <Settings className="w-3.5 h-3.5" />
            {t.cmsTabSettings}
          </button>
          <button
            onClick={() => setActiveSubTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "users"
                ? "text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            style={activeSubTab === "users" ? { backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}40` } : {}}
            id="subtab-users"
          >
            <Users className="w-3.5 h-3.5" />
            {t.cmsTabUsers}
          </button>
        </div>
      </div>

      {/* Success Banner notification */}
      {successMsg && (
        <div className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SUB-TAB VIEWPORT 1: ANALYTICS */}
      {activeSubTab === "analytics" && stats && (
        <div className="space-y-6" id="cms-analytics-panel">
          {/* Dashboard metric grid tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center text-red-500">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsCatalogTitles}</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.totalMovies}</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsTotalViews}</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsWatchHours}</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.totalWatchTime.toLocaleString()} hrs</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsSaasSignups}</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          {/* SVG Graphs and charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Views over time bar chart */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">{t.cmsAudienceTraffic}</h3>
              <div className="h-44 w-full flex items-end justify-between pt-4">
                {stats.recentViews.map((item, idx) => {
                  const maxCount = Math.max(...stats!.recentViews.map(v => v.count));
                  const percentage = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                      <span className="text-[10px] font-mono font-semibold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.count}
                      </span>
                      <div className="w-8 bg-zinc-900 group-hover:bg-red-600 rounded-sm relative overflow-hidden transition-colors" style={{ height: "110px" }}>
                        <div 
                          className="bg-red-600/35 h-full absolute bottom-0 left-0 right-0 transition-all duration-500" 
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-500">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top performing movies table */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">{t.cmsEngagementLeaders}</h3>
              <div className="space-y-3.5" id="engagement-leaderboard">
                {stats.topMovies.map((m, idx) => (
                  <div key={m.id} className="flex items-center justify-between border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-[10px] font-black text-red-500 flex items-center justify-center border border-zinc-850">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-zinc-200 truncate max-w-44 md:max-w-64">{m.title}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-zinc-500 font-mono">{m.views.toLocaleString()} {t.cmsViews}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                        ★ {m.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Genre Distribution Badges */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Genre Saturation</h3>
            <div className="flex flex-wrap gap-2">
              {stats.genreDistribution.map((item, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center gap-2 text-xs font-semibold"
                >
                  <span className="text-zinc-300">{item.name}</span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-red-600/15 text-red-400 font-mono text-[10px]">
                    {item.count} {t.cmsItems}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB VIEWPORT 2: CATALOG MANAGEMENT */}
      {activeSubTab === "catalog" && (
        <div className="space-y-6" id="cms-catalog-panel">
          {/* Create movie action and quick info */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <p className="text-xs text-zinc-400">
              {t.cmsShowingOf} <span className="text-white font-bold">{filteredAndSortedMovies.length}</span> {t.cmsOf} <span className="text-zinc-550">{movies.length}</span> {t.cmsTitles}
            </p>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 text-white font-bold text-xs px-4 py-2.5 rounded-md shadow-lg transition-all cursor-pointer hover:opacity-90"
            style={{ backgroundColor: brandColor, boxShadow: `0 0 15px ${brandColor}30` }}
              id="cms-add-movie-btn"
            >
              <Plus className="w-4 h-4" />
              {t.cmsPublishTitle}
            </button>
          </div>

          {/* Controls Bar: Filter & Sort */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-xs">
            {/* Search filter input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder={t.cmsSearchCatalog}
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-200 pl-9 pr-4 py-2 rounded-lg border border-zinc-800 focus:border-zinc-700 focus:outline-hidden transition-all placeholder:text-zinc-550"
              />
              {catalogSearch && (
                <button 
                  onClick={() => setCatalogSearch("")}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter & Sort select dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">{t.cmsType}</span>
                <select
                  value={catalogFilterType}
                  onChange={(e) => setCatalogFilterType(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg focus:outline-hidden focus:border-zinc-700 cursor-pointer"
                >
                  <option value="all">{t.cmsAllContent}</option>
                  <option value="movie">{t.cmsMoviesOnly}</option>
                  <option value="series">{t.cmsTvSeriesOnly}</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">{t.cmsSortBy}</span>
                <select
                  value={catalogSortBy}
                  onChange={(e) => setCatalogSortBy(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg focus:outline-hidden focus:border-zinc-700 cursor-pointer"
                >
                  <option value="recent">{t.cmsRecentlyAdded}</option>
                  <option value="title-asc">{t.cmsTitleAZ}</option>
                  <option value="title-desc">{t.cmsTitleZA}</option>
                  <option value="year-desc">{t.cmsYearNewest}</option>
                  <option value="year-asc">{t.cmsYearOldest}</option>
                  <option value="views-desc">{t.cmsViewsMost}</option>
                  <option value="likes-desc">{t.cmsLikesMost}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Listing Table */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
            <div className="overflow-auto max-h-[550px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800 shadow-xs">
                  <tr className="text-zinc-550 font-bold uppercase tracking-wider">
                    <th className="p-4">{t.cmsColMovieInfo}</th>
                    <th className="p-4">{t.cmsColYearDuration}</th>
                    <th className="p-4">{t.cmsColGenres}</th>
                    <th className="p-4">{t.cmsColViewsLikes}</th>
                    <th className="p-4">{t.cmsColAttributes}</th>
                    <th className="p-4 text-right">{t.cmsColActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900" id="cms-catalog-tbody">
                  {filteredAndSortedMovies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        {t.cmsNoMatchingTitles}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedMovies.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={m.posterUrl} 
                            alt={m.title} 
                            className="w-8 h-12 rounded object-cover border border-zinc-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-zinc-200 text-xs">{m.title}</p>
                              <span className={`px-1 rounded-sm text-[8px] font-black uppercase tracking-wider ${
                                m.contentType === "series" ? "bg-red-600/10 text-red-500 border border-red-500/20" : "bg-blue-600/10 text-blue-500 border border-blue-500/20"
                              }`}>
                                {m.contentType === "series" ? "Series" : "Movie"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.quality} • {m.ageRating}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-zinc-400">
                        {m.releaseYear}
                        <span className="block text-[10px] text-zinc-600 mt-0.5">
                          {m.contentType === "series"
                            ? `${m.seasons?.length || 0} ${t.cmsSeasons}`
                            : `${m.duration} ${t.cmsMinutes}`}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-44">
                          {m.genres.map((g, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-850 rounded text-[9px] text-zinc-400 font-medium">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-zinc-400">
                        {m.views.toLocaleString()}
                        <span className="block text-[10px] text-zinc-600 mt-0.5">{m.likes.toLocaleString()} {t.cmsLikes}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {m.isBanner && (
                            <span className="px-1.5 py-0.2 bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] rounded font-bold uppercase tracking-wider">
                              {t.cmsBannerSpotlight}
                            </span>
                          )}
                          {m.isFeatured && (
                            <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] rounded font-bold uppercase tracking-wider">
                              {t.cmsFeaturedRow}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit Title"
                            id={`edit-movie-btn-${m.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(m.id)}
                            className="p-1.5 rounded-md hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Title"
                            id={`delete-movie-btn-${m.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full-screen catalog editor workspace */}
          {showForm && (
            <div className="fixed inset-0 z-50 bg-[#070708] flex flex-col">
              <div className="px-5 md:px-8 py-4 border-b border-white/10 bg-black/70 backdrop-blur-xl flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Film className="w-5 h-5" style={{ color: brandColor }} />
                      {formMode === "create" ? t.cmsPublishNewTitle : t.cmsEditCatalogMeta}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {t.cmsEditorDesc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      form="catalog-editor-form"
                      className="px-4 py-2 text-white text-xs font-bold rounded-md shadow-lg cursor-pointer hover:brightness-110"
                      style={{ backgroundColor: brandColor, boxShadow: `0 12px 28px ${brandColor}24` }}
                    >
                      {t.cmsPublishMetadata}
                    </button>
                  <button 
                    onClick={() => setShowForm(false)}
                      className="p-2 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-white transition-colors cursor-pointer border border-white/10"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                  </div>
                </div>

                {/* Form fields */}
              <form id="catalog-editor-form" onSubmit={handleSaveMovie} className="flex-1 overflow-y-auto p-5 md:p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
                  <aside className="space-y-5 xl:sticky xl:top-6">
                    <div className="rounded-lg border border-white/10 bg-linear-to-b from-white/[0.055] to-white/[0.025] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="w-4 h-4" style={{ color: brandColor }} />
                          {t.cmsTmdbImport}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {t.cmsTmdbImportDesc}
                        </p>
                      </div>
                      {tmdbLoading && (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" style={{ color: brandColor }} />
                      )}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder={t.cmsSearchTmdb}
                        value={tmdbQuery}
                        onChange={(e) => setTmdbQuery(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-white/10 p-2.5 pl-9 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                      />
                    </div>

                    {selectedTmdbId && (
                      <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/25 px-3 py-2">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">{t.cmsSelectedTmdbSource}</p>
                          <p className="text-xs text-zinc-200 font-mono">
                            {selectedTmdbMediaType === "tv" ? "TV" : "Movie"} #{selectedTmdbId}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTmdbId(undefined);
                            setSelectedTmdbMediaType(undefined);
                          }}
                          className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {t.cmsClearLink}
                        </button>
                      </div>
                    )}

                    {tmdbError && (
                      <div className="text-[11px] text-red-400 bg-red-950/20 border border-red-500/20 rounded p-2">
                        {tmdbError}
                      </div>
                    )}

                    {tmdbResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {tmdbResults.map((item) => (
                          <div key={item.id} className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
                            item.alreadyImported ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-zinc-900/40"
                          }`}>
                            {item.posterUrl ? (
                              <img src={item.posterUrl} alt="" className="w-10 h-14 rounded object-cover bg-zinc-950 border border-zinc-800 shrink-0" />
                            ) : (
                              <div className="w-10 h-14 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                                {item.type === "series" ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-zinc-100 truncate">{item.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate">
                                {item.subtitle}
                                {item.alreadyImported ? ` • ${t.cmsAlreadyInDb}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => applyTmdbMetadata(item)}
                              disabled={applyingTmdbId === item.tmdbId || item.alreadyImported}
                              className="px-2.5 py-1.5 text-[10px] font-black rounded border transition-all cursor-pointer disabled:opacity-60"
                              style={item.alreadyImported ? undefined : { color: brandColor, borderColor: `${brandColor}35`, backgroundColor: `${brandColor}12` }}
                            >
                              {item.alreadyImported ? t.cmsExistsBtn : applyingTmdbId === item.tmdbId ? t.cmsImportingBtn : t.cmsApplyBtn}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!tmdbLoading && tmdbQuery.trim().length >= 2 && !tmdbError && tmdbResults.length === 0 && (
                      <p className="text-[10px] text-zinc-600">No TMDB matches yet. Try a more exact title.</p>
                    )}
                    </div>

                    <div className="rounded-lg border border-white/10 bg-zinc-950/70 overflow-hidden">
                      <div className="relative h-64 bg-zinc-900">
                        {backdropUrl ? (
                          <img src={backdropUrl} alt="" className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">{t.cmsBackdropPreview}</div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
                        <div className="absolute left-4 bottom-4 flex items-end gap-4">
                          <div className="w-24 aspect-[2/3] rounded-md overflow-hidden border border-white/15 bg-zinc-950 shadow-xl">
                            {posterUrl ? (
                              <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 text-center px-2">{t.cmsPosterLabel}</div>
                            )}
                          </div>
                          <div className="min-w-0 pb-1">
                            <p className="text-lg font-black text-white line-clamp-2">{title || "Untitled catalog title"}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-200">{contentType === "series" ? "TV Series" : "Movie"}</span>
                              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-200">{releaseYear}</span>
                              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-200">★ {rating}</span>
                              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-200">{quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[10px] text-zinc-500">
                          {genres.length ? genres.join(", ") : t.cmsNoGenresYet}
                        </p>
                        <span
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border"
                          style={{ color: brandColor, borderColor: `${brandColor}35`, backgroundColor: `${brandColor}10` }}
                        >
                          {selectedTmdbId ? t.cmsTmdbLinked : t.cmsManualDraft}
                        </span>
                      </div>
                    </div>
                  </aside>

                  <section className="space-y-5 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsTitleHeadline}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sintel: Path of the Dragon"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setTmdbQuery(e.target.value);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-title"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsTmdbId}</label>
                      <input
                        type="text"
                        readOnly
                        value={selectedTmdbId ? `${selectedTmdbMediaType === "tv" ? "tv" : "movie"}:${selectedTmdbId}` : (t.cmsManualEntry || "Manual entry")}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2.5 rounded text-xs text-zinc-500 font-mono"
                      />
                    </div>
                    </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-zinc-900/60 pb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsContentClass}</label>
                      <select
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden text-zinc-300 font-bold"
                      >
                        <option value="movie">{t.cmsSingleMovie}</option>
                        <option value="series">{t.cmsTvSeriesShow}</option>
                      </select>
                    </div>
                    {contentType === "series" ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsSeasonsEpEst}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={1}
                            max={20}
                            placeholder="Seasons"
                            value={seasonsCount}
                            onChange={(e) => setSeasonsCount(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden font-mono font-bold text-center"
                          />
                          <input
                            type="number"
                            min={1}
                            max={50}
                            placeholder="Episodes"
                            value={episodesPerSeason}
                            onChange={(e) => setEpisodesPerSeason(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden font-mono font-bold text-center"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 flex items-end">
                        <p className="text-[10px] text-zinc-500 leading-normal pb-1">Features full subtitle captions support in player.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsSynopsis}</label>
                    <textarea
                      placeholder="Detailed narrative summary..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                      id="form-input-desc"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsVideoSourceUrl}</label>
                      <input
                        type="url"
                        required
                        placeholder="https://commondatastorage.googleapis.com/...mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-video"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsPosterFrameUrl}</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/...poster.jpg"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-poster"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsBackdropUrl}</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/...backdrop.jpg"
                        value={backdropUrl}
                        onChange={(e) => setBackdropUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-backdrop"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsReleaseYear}</label>
                      <input
                        type="number"
                        min={1900}
                        max={2100}
                        value={releaseYear}
                        onChange={(e) => setReleaseYear(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-year"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsDurationMin}</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsAgeRating}</label>
                      <select
                        value={ageRating}
                        onChange={(e) => setAgeRating(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden text-zinc-300 font-bold"
                      >
                        {["G", "PG", "PG-13", "R", "NC-17"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsQualitySpec}</label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden text-zinc-300 font-bold"
                      >
                        {["4K", "Ultra HD", "Full HD", "HD"].map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsGenresComma}</label>
                      <input
                        type="text"
                        placeholder="Drama, Sci-Fi, Action"
                        value={genres.join(", ")}
                        onChange={(e) => setGenres(e.target.value.split(",").map(g => g.trim()).filter(Boolean))}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsDirectorsComma}</label>
                      <input
                        type="text"
                        placeholder="Director name"
                        value={directors.join(", ")}
                        onChange={(e) => setDirectors(e.target.value.split(",").map(d => d.trim()).filter(Boolean))}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsCastComma}</label>
                    <input
                      type="text"
                      placeholder="Actor Alpha, Actor Beta, Actor Gamma"
                      value={cast.join(", ")}
                      onChange={(e) => setCast(e.target.value.split(",").map(c => c.trim()).filter(Boolean))}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                    />
                  </div>

                  {/* Seasons & Episodes Builder */}
                  {contentType === "series" && (
                    <div className="border-t border-zinc-900/80 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Tv className="w-4 h-4 text-red-500" />
                            {t.cmsSeasonsBuilder}
                          </h4>
                          <p className="text-[10px] text-zinc-500">
                            {t.cmsSeasonsBuilderDesc}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSeason}
                          className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 border border-red-500/20 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t.cmsAddSeason}
                        </button>
                      </div>

                      {seasons.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/20">
                          <Tv className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                          <p className="text-xs text-zinc-500 font-bold">{t.cmsNoSeasonsYet}</p>
                          <p className="text-[10px] text-zinc-600 mt-1">{t.cmsNoSeasonsNote}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {seasons.map((season) => (
                            <div key={season.id} className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3 space-y-3">
                              <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-xs font-black text-red-500 font-mono">S{season.seasonNumber}</span>
                                  <input
                                    type="text"
                                    value={season.title}
                                    onChange={(e) => handleUpdateSeasonTitle(season.id, e.target.value)}
                                    placeholder={`Season ${season.seasonNumber} Title`}
                                    className="bg-transparent border-b border-transparent hover:border-zinc-850 focus:border-red-500/50 text-xs font-bold text-zinc-200 focus:outline-hidden py-0.5 px-1 max-w-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddEpisode(season.id)}
                                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" /> {t.cmsAddEpisode}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSeason(season.id)}
                                    className="p-1 text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
                                    title="Remove Season"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Episodes List in Season */}
                              <div className="space-y-3 pl-3 border-l border-zinc-900">
                                {season.episodes.map((ep) => (
                                  <div key={ep.id} className="bg-zinc-900/30 border border-zinc-900 rounded p-2.5 space-y-2 relative group/ep">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-black text-zinc-500 font-mono uppercase">
                                        {t.cmsEpisodeLabel} {ep.episodeNumber}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEpisode(season.id, ep.id)}
                                        className="p-1 text-zinc-700 hover:text-red-500 transition-colors cursor-pointer"
                                        title="Remove Episode"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsEpisodeTitleField}</label>
                                        <input
                                          type="text"
                                          required
                                          value={ep.title}
                                          onChange={(e) => handleUpdateEpisode(season.id, ep.id, "title", e.target.value)}
                                          placeholder={`Episode ${ep.episodeNumber} Title`}
                                          className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[11px] text-zinc-300 focus:outline-hidden focus:border-red-500/30"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsEpisodeDuration}</label>
                                        <input
                                          type="number"
                                          required
                                          min={1}
                                          value={ep.duration}
                                          onChange={(e) => handleUpdateEpisode(season.id, ep.id, "duration", Number(e.target.value))}
                                          placeholder="e.g. 45"
                                          className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[11px] text-zinc-300 focus:outline-hidden focus:border-red-500/30"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-0.5">
                                      <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsEpisodeVideoUrl}</label>
                                      <input
                                        type="url"
                                        required
                                        value={ep.videoUrl}
                                        onChange={(e) => handleUpdateEpisode(season.id, ep.id, "videoUrl", e.target.value)}
                                        placeholder="https://commondatastorage.googleapis.com/...mp4"
                                        className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[11px] text-zinc-300 focus:outline-hidden focus:border-red-500/30 font-mono"
                                      />
                                    </div>

                                    <div className="space-y-0.5">
                                      <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsEpisodeShortSynopsis}</label>
                                      <textarea
                                        value={ep.description || ""}
                                        onChange={(e) => handleUpdateEpisode(season.id, ep.id, "description", e.target.value)}
                                        placeholder="Brief description of the episode's plot..."
                                        rows={1.5}
                                        className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[11px] text-zinc-300 focus:outline-hidden focus:border-red-500/30 leading-snug"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={isBanner}
                        onChange={(e) => setIsBanner(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-850 accent-red-600 focus:ring-0"
                        id="form-check-banner"
                      />
                      <div>
                        <label htmlFor="form-check-banner" className="text-xs font-bold text-zinc-300">{t.cmsBannerLabel}</label>
                        <p className="text-[9px] text-zinc-500">{t.cmsBannerNote}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-850 accent-red-600 focus:ring-0"
                        id="form-check-featured"
                      />
                      <div>
                        <label htmlFor="form-check-featured" className="text-xs font-bold text-zinc-300">{t.cmsFeaturedLabel}</label>
                        <p className="text-[9px] text-zinc-500">{t.cmsFeaturedNote}</p>
                      </div>
                    </div>
                  </div>

                  {/* Submission row */}
                  <div className="border-t border-zinc-900 pt-4 flex gap-3 justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-semibold hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                    >
                      {t.cmsDismiss}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded shadow-lg shadow-red-600/10 cursor-pointer"
                      id="form-save-btn"
                    >
                      {t.cmsPublishMetadata}
                    </button>
                  </div>
                  </section>
                </div>
                </form>
              </div>
          )}
        </div>
      )}

      {/* SUB-TAB VIEWPORT 3: SETTINGS */}
      {activeSubTab === "settings" && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6" id="cms-settings-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branding Settings Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">{t.cmsPortalIdentity}</h3>
 
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsSiteNameLabel}</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => updateSettingsField("siteName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                  id="settings-input-sitename"
                />
              </div>
 
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsLogoTextLabel}</label>
                <input
                  type="text"
                  value={settings.logoText}
                  onChange={(e) => updateSettingsField("logoText", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                  id="settings-input-logotext"
                />
              </div>
 
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 block">{t.cmsThemeColor}</label>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Preset Colors */}
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => updateSettingsField("primaryColor", preset.value)}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center border-2 ${
                        settings.primaryColor.toLowerCase() === preset.value.toLowerCase()
                          ? "border-white ring-2 ring-white/20 scale-105"
                          : "border-transparent hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      {settings.primaryColor.toLowerCase() === preset.value.toLowerCase() && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
 
                  {/* Custom Color Selector (Color Wheel) */}
                  <div className="relative w-8 h-8 rounded-full border-2 border-transparent hover:border-zinc-500 transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center overflow-hidden"
                    style={{ background: "conic-gradient(from 0deg, red, yellow, green, blue, purple, red)" }}
                    title="Custom Color Picker"
                  >
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSettingsField("primaryColor", e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    {!PRESET_COLORS.some(p => p.value.toLowerCase() === settings.primaryColor.toLowerCase()) && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full mix-blend-difference" />
                    )}
                  </div>
 
                  {/* HEX Input */}
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("#") && val.length <= 7) {
                        updateSettingsField("primaryColor", val);
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-zinc-300 w-24 tracking-wider uppercase text-center"
                    placeholder="#HEX"
                  />
                </div>
              </div>
            </div>
 
            {/* General Toggles / Maintenance Gates */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">{t.cmsFeaturePermissions}</h3>
 
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                  <p className="text-xs font-bold text-zinc-200">{t.cmsEnableComments}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{t.cmsEnableCommentsDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableComments}
                  onChange={(e) => updateSettingsField("enableComments", e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-850 accent-red-600"
                />
              </div>
 
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                  <p className="text-xs font-bold text-zinc-200">{t.cmsEnableRatings}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{t.cmsEnableRatingsDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableRatings}
                  onChange={(e) => updateSettingsField("enableRatings", e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-850 accent-red-600"
                />
              </div>
 
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-200">{t.cmsMaintenanceMode}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{t.cmsMaintenanceModeDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSettingsField("maintenanceMode", e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-850 accent-red-600"
                />
              </div>
            </div>
          </div>
 
          {/* SEO Metadata Settings */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">{t.cmsSeoMetadata}</h3>
 
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsSeoTitle}</label>
              <input
                type="text"
                value={settings.seoTitle}
                onChange={(e) => updateSettingsField("seoTitle", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
              />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsSeoKeywords}</label>
                <input
                  type="text"
                  value={settings.seoKeywords}
                  onChange={(e) => updateSettingsField("seoKeywords", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                />
              </div>
 
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsSeoDescription}</label>
                <textarea
                  value={settings.seoDescription}
                  onChange={(e) => updateSettingsField("seoDescription", e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden"
                />
              </div>
            </div>
          </div>
 
          {/* Settings Save Actions */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-6 py-3 rounded-md shadow-lg shadow-red-600/10 cursor-pointer"
              id="settings-save-btn"
            >
              <Save className="w-4 h-4" />
              {t.cmsCommitConfig}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB VIEWPORT 4: USER BASE MANAGEMENT */}
      {activeSubTab === "users" && (
        <div className="space-y-6" id="cms-users-panel">
          {/* Section Header */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">{t.cmsUserBaseTitle}</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {t.cmsUserBaseDesc}
              </p>
            </div>
            <div className="bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-md text-red-500 font-mono text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{usersList.length} {t.cmsAccountsRegistered}</span>
            </div>
          </div>

          {/* User list Table container */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="p-4">User Details</th>
                    <th className="p-4">System Role Scope</th>
                    <th className="p-4">Registered On</th>
                    <th className="p-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 italic">
                        {t.cmsNoUsers}
                      </td>
                    </tr>
                  ) : (
                    usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={usr.profileImage || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80`}
                              alt={usr.name}
                              className="w-10 h-10 rounded-full border border-zinc-800 object-cover bg-zinc-900"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-extrabold text-white text-sm">{usr.name}</p>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{usr.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {usr.role === "admin" ? (
                            <span className="px-2.5 py-1 rounded bg-red-600/15 border border-red-600/30 text-red-500 text-[10px] font-black uppercase tracking-wider font-mono">
                              {t.cmsSystemAdmin}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider font-mono">
                              {t.cmsStandardViewer}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-400 font-mono">
                          {new Date(usr.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleUserRole(usr.id, usr.role)}
                              className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold hover:text-white transition-all text-[11px] cursor-pointer"
                              title="Toggle admin / user role scopes"
                            >
                              {t.cmsToggleRole}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(usr.id)}
                              className="p-1.5 rounded bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                              title="Delete active member from directories"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
