/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, Film, Settings, Plus, Edit, Trash2, Save, 
  Tv, Eye, Play, ShieldAlert, CheckCircle, TrendingUp, Users, RefreshCw, X, Search, Database,
  CreditCard, UserCheck, Subtitles, Upload, Radio, Pencil, Wifi, WifiOff, Activity, Loader2, AlertCircle
} from "lucide-react";
import { Movie, DashboardStats, CMSSettings, Subtitle, User, Season, Episode } from "../types";
import IPTVScanner from "./IPTVScanner";
import MediaPlayer from "./MediaPlayer";

interface AdminCMSProps {
  onRefreshMovies: () => void;
  movies: Movie[];
  globalSettings: CMSSettings;
  onUpdateGlobalSettings: (settings: CMSSettings) => void;
  currentUser: User | null;
  t: any;
  onSelectMovie?: (movie: Movie) => void;
}

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80";

const normalizeCdnUrl = (url: string | undefined | null, fallbackUrl: string = DEFAULT_POSTER): string => {
  if (!url) return fallbackUrl;
  const trimmed = url.trim();
  if (!trimmed) return fallbackUrl;
  const cdnBase = "https://cdn.mystreamflix.biz.id";

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("/uploads/")) return trimmed;
    return `${cdnBase}${trimmed}`;
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("blob:") && !trimmed.startsWith("data:")) {
    return `${cdnBase}/${trimmed}`;
  }

  if (trimmed.includes(".r2.dev/")) {
    return trimmed.replace(/^https?:\/\/[^\/]+\.r2\.dev/, cdnBase);
  }
  return trimmed;
};

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
  contentType: "movie" | "series" | "livetv";
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
  currentUser,
  t,
  onSelectMovie,
}: AdminCMSProps) {
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "catalog" | "livetv" | "settings" | "users">("analytics");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<CMSSettings | null>(globalSettings || null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  const [creatingUser, setCreatingUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom Modal Dialog States (replacing native browser alert/confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (message: string, title: string = "Notice") => {
    setAlertDialog({ isOpen: true, title, message });
  };

  const showConfirm = (message: string, onConfirm: () => void, title: string = "Confirmation", actionLabel: string = "Confirm") => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, actionLabel });
  };

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [draggingLogo, setDraggingLogo] = useState(false);

  // ====== Channel Health Monitor State ======
  type ChannelHealthStatus = {
    status: "online" | "offline" | "error" | "checking";
    statusCode?: number;
    responseTime?: number;
    error?: string;
    checkedAt?: string;
  };
  const [channelHealth, setChannelHealth] = useState<Record<string, ChannelHealthStatus>>({});
  const [healthCheckRunning, setHealthCheckRunning] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);
  const [liveTvStatusFilter, setLiveTvStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);

  const handleRemoveOfflineChannels = () => {
    const offlineIds = Object.entries(channelHealth)
      .filter(([_, v]) => v.status === "offline" || v.status === "error")
      .map(([id]) => id);

    if (offlineIds.length === 0) {
      showAlert("No offline channels detected.");
      return;
    }

    showConfirm(
      `Are you sure you want to remove all ${offlineIds.length} offline/broken channels from database?`,
      async () => {
        try {
          for (const id of offlineIds) {
            await fetch(`/api/movies/${id}`, { method: "DELETE" }).catch(() => {});
          }
          setSuccessMsg(`Successfully removed ${offlineIds.length} offline channels.`);
          setChannelHealth({});
          onRefreshMovies();
          setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err: any) {
          showAlert(err.message || "Failed removing offline channels.");
        }
      },
      "Remove Offline Channels",
      "Remove All Offline"
    );
  };

  const runHealthCheck = async () => {
    const liveTvChannels = movies.filter(m => m.contentType === "livetv" || m.id.startsWith("tv-"));
    if (liveTvChannels.length === 0) {
      showAlert("No Live TV channels found to check.");
      return;
    }

    setHealthCheckRunning(true);
    const checkingState: Record<string, ChannelHealthStatus> = {};
    liveTvChannels.forEach(ch => {
      checkingState[ch.id] = { status: "checking" };
    });
    setChannelHealth(checkingState);

    try {
      const res = await fetch("/api/livetv/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: liveTvChannels.map(ch => ({ id: ch.id, url: ch.videoUrl }))
        })
      });

      if (!res.ok) throw new Error("Health check API request failed.");
      const data = await res.json();

      const newHealthState: Record<string, ChannelHealthStatus> = {};
      (data.results || []).forEach((r: any) => {
        newHealthState[r.id] = {
          status: r.status,
          statusCode: r.statusCode,
          responseTime: r.responseTime,
          error: r.error,
          checkedAt: data.summary?.checkedAt,
        };
      });
      setChannelHealth(newHealthState);
      setLastHealthCheck(data.summary?.checkedAt || new Date().toISOString());

      const { online, offline, errors } = data.summary || {};
      setSuccessMsg(`Health Check Complete — ${online} online, ${offline} offline, ${errors} errors`);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      showAlert(err.message || "Health check failed.");
      const errorState: Record<string, ChannelHealthStatus> = {};
      liveTvChannels.forEach(ch => {
        errorState[ch.id] = { status: "error", error: "Health check API unreachable" };
      });
      setChannelHealth(errorState);
    } finally {
      setHealthCheckRunning(false);
    }
  };

  // Sync settings state with prop
  useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
    }
  }, [globalSettings]);

  const loadDashboardStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed loading stats", e);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [movies]);

  // Update a single settings field in real-time
  const updateSettingsField = (key: keyof CMSSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateGlobalSettings(newSettings);
  };

  // Handle image uploads for the Site Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>, isDropped = false) => {
    let file: File | null = null;
    if (isDropped) {
      const dragEvent = e as React.DragEvent<HTMLDivElement>;
      dragEvent.preventDefault();
      if (dragEvent.dataTransfer.files && dragEvent.dataTransfer.files.length > 0) {
        file = dragEvent.dataTransfer.files[0];
      }
    } else {
      const changeEvent = e as React.ChangeEvent<HTMLInputElement>;
      if (changeEvent.target.files && changeEvent.target.files.length > 0) {
        file = changeEvent.target.files[0];
      }
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("Please upload an image file (PNG, JPG, SVG, etc.).");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload?folder=branding", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload logo.");
      }

      const data = await res.json();
      updateSettingsField("logoUrl", data.url);
    } catch (err: any) {
      showAlert(err.message || "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingLogo(true);
  };

  const handleLogoDragLeave = () => {
    setDraggingLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleLogoUpload(e, true);
    setDraggingLogo(false);
  };

  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);

  const handleGenericFileUpload = async (file: File, folder: string, onSuccess: (url: string) => void, setBusy?: (b: boolean) => void) => {
    if (setBusy) setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/upload?folder=${folder}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      const data = await res.json();
      onSuccess(data.url);
    } catch (err: any) {
      showAlert(err.message || "Failed to upload file to Cloudflare R2.");
    } finally {
      if (setBusy) setBusy(false);
    }
  };

  const brandColor = "#00ADB5";

  // Catalog Filter / Sort States
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilterType, setCatalogFilterType] = useState<"all" | "movie" | "series">("all");
  const [catalogSortBy, setCatalogSortBy] = useState<string>("recent");

  // Filter and sort the movie catalog locally to avoid unnecessary API calls
  // when the user types in the search bar or changes the sort dropdown.
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    // 1. Filter by content type
    if (catalogFilterType !== "all") {
      result = result.filter(m => m.contentType === catalogFilterType);
    } else {
      result = result.filter(m => m.contentType !== "livetv" && !m.id.startsWith("tv-"));
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
  const [contentType, setContentType] = useState<"movie" | "series" | "livetv">("movie");
  const [seasonsCount, setSeasonsCount] = useState(1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState(5);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  // ====== Dedicated Live TV Channel Form States ======
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelFormMode, setChannelFormMode] = useState<'create' | 'edit'>('create');
  const [channelEditId, setChannelEditId] = useState<string | null>(null);
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelStreamUrl, setChannelStreamUrl] = useState('');
  const [channelLogoUrl, setChannelLogoUrl] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelCountry, setChannelCountry] = useState('Indonesia');
  const [channelLanguage, setChannelLanguage] = useState('Indonesian');
  const [channelCategories, setChannelCategories] = useState<string[]>(['News']);
  const [channelQuality, setChannelQuality] = useState('HD');

  const LIVE_TV_CATEGORIES = ['News', 'Entertainment', 'Sports', 'Kids', 'Science', 'Business', 'Culture', 'Local ID', 'Religious', 'Music', 'Documentary', 'General'];

  const handleOpenAddChannel = () => {
    setChannelFormMode('create');
    setChannelEditId(null);
    setChannelName('');
    setChannelStreamUrl('');
    setChannelLogoUrl('');
    setChannelDescription('');
    setChannelCountry('Indonesia');
    setChannelLanguage('Indonesian');
    setChannelCategories(['News']);
    setChannelQuality('HD');
    setShowChannelForm(true);
  };

  const handleOpenEditChannel = (ch: Movie) => {
    setChannelFormMode('edit');
    setChannelEditId(ch.id);
    setChannelName(ch.title);
    setChannelStreamUrl(normalizeCdnUrl(ch.videoUrl));
    setChannelLogoUrl(normalizeCdnUrl(ch.posterUrl));
    setChannelDescription(ch.description);
    setChannelCountry(ch.country || 'Indonesia');
    setChannelLanguage(ch.language || 'Indonesian');
    setChannelCategories(ch.genres || ['News']);
    setChannelQuality(ch.quality || 'HD');
    setShowChannelForm(true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !channelStreamUrl.trim()) {
      showAlert('Nama channel dan stream URL wajib diisi.');
      return;
    }
    setChannelSaving(true);
    try {
      const payload = {
        title: channelName.trim(),
        description: channelDescription.trim() || (channelName.trim() + ' - Live Streaming Channel'),
        posterUrl: channelLogoUrl.trim() || 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300&auto=format&fit=crop&q=80',
        backdropUrl: channelLogoUrl.trim() || 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&auto=format&fit=crop&q=80',
        videoUrl: channelStreamUrl.trim(),
        duration: 0,
        releaseYear: new Date().getFullYear(),
        rating: 0,
        ageRating: 'G',
        quality: channelQuality,
        genres: channelCategories,
        cast: [],
        directors: [],
        country: channelCountry.trim(),
        language: channelLanguage.trim(),
        isFeatured: false,
        isBanner: false,
        contentType: 'livetv',
        seasons: [],
        subtitles: []
      };
      const url = channelFormMode === 'create' ? '/api/movies' : `/api/movies/${channelEditId}`;
      const method = channelFormMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan channel.');
      }
      setSuccessMsg(channelFormMode === 'create' ? 'Channel berhasil ditambahkan! âœ…' : 'Channel berhasil diperbarui! âœ…');
      setShowChannelForm(false);
      onRefreshMovies();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan channel.');
    } finally {
      setChannelSaving(false);
    }
  };

  const handleAddSubtitle = () => {
    const newSub: Subtitle = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      language: "id",
      label: "Bahasa Indonesia",
      fileUrl: ""
    };
    setSubtitles([...subtitles, newSub]);
  };

  const handleRemoveSubtitle = (subId: string) => {
    setSubtitles(subtitles.filter(s => s.id !== subId));
  };

  const handleUpdateSubtitle = (subId: string, field: keyof Subtitle, value: string) => {
    setSubtitles(subtitles.map(s => s.id === subId ? { ...s, [field]: value } : s));
  };

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
    setSubtitles([]);
    setShowForm(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setFormMode("edit");
    setEditingMovieId(movie.id);
    setActiveSubTab("catalog"); // Switch to catalog tab so the form is visible
    setTitle(movie.title);
    setDescription(movie.description);
    setPosterUrl(normalizeCdnUrl(movie.posterUrl));
    setBackdropUrl(normalizeCdnUrl(movie.backdropUrl));
    setVideoUrl(normalizeCdnUrl(movie.videoUrl));
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
    setSeasons(
      (movie.seasons || []).map((s) => ({
        ...s,
        episodes: (s.episodes || []).map((e) => ({ ...e, videoUrl: normalizeCdnUrl(e.videoUrl) }))
      }))
    );
    setTmdbQuery(movie.title);
    setSelectedTmdbId(movie.tmdbId);
    setSelectedTmdbMediaType(movie.tmdbMediaType);
    setTmdbResults([]);
    setTmdbError("");
    setSubtitles((movie.subtitles || []).map((sub) => ({ ...sub, fileUrl: normalizeCdnUrl(sub.fileUrl) })));
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

  const handleDeleteMovie = (movieId: string) => {
    showConfirm(
      t.cmsDeleteMovieConfirm || "Are you sure you want to delete this title?",
      async () => {
        try {
          const res = await fetch(`/api/movies/${movieId}`, { method: "DELETE" });
          if (!res.ok) throw new Error(t.cmsDeletedMovie);
          
          setSuccessMsg(t.cmsDeletedMovie);
          onRefreshMovies();
          setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err: any) {
          showAlert(err.message || t.cmsFailedSave);
        }
      },
      "Delete Title",
      "Delete"
    );
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      showAlert(t.cmsTitleVideoRequired);
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
      seasons: seasonsPayload,
      subtitles
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
      showAlert(err.message || "Save operation failed.");
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
      showAlert(err.message || "Settings update failed.");
    }
  };

  const refreshUsersList = async () => {
    const usersRes = await fetch("/api/users");
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsersList(usersData);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showAlert("Name, email, and password are required.");
      return;
    }

    setCreatingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      setSuccessMsg("User account created successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
      await refreshUsersList();
    } catch (err: any) {
      showAlert(err.message || "User creation failed.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: "admin" | "user") => {
    if (currentUser?.id === userId) {
      showAlert("You cannot change the role of your own active admin account.");
      return;
    }

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
      await refreshUsersList();
    } catch (err: any) {
      showAlert(err.message || "Role shift failed.");
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
      showAlert("You cannot delete your own active admin account.");
      return;
    }

    showConfirm(
      t.cmsDeleteUserConfirm || "Are you sure you want to delete this user account?",
      async () => {
        try {
          const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete account.");
          }
          setSuccessMsg(t.cmsUserDeleted);
          setTimeout(() => setSuccessMsg(""), 3500);
          await refreshUsersList();
        } catch (err: any) {
          showAlert(err.message || "User deletion failed.");
        }
      },
      "Delete User Account",
      "Delete User"
    );
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
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900 overflow-x-auto max-w-full scrollbar-none" id="cms-subtabs">
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
            onClick={() => setActiveSubTab("livetv")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "livetv"
                ? "text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            style={activeSubTab === "livetv" ? { backgroundColor: "#DC2626", boxShadow: `0 0 10px rgba(220, 38, 38, 0.4)` } : {}}
            id="subtab-livetv"
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>📺 Live TV</span>
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

          {/* Real-time Performance Top Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ADB5]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Sistem Real-Time Active
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Live Telemetry Data</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Platform Analytics & Insights Dashboard</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Ringkasan statistik penonton, performa tayangan TV & katalog film, tingkat konversi VIP, dan analisis trafik penonton secara real-time.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={loadDashboardStats}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#00ADB5]" />
                  Refresh Telemetry
                </button>
              </div>
            </div>
          </div>

          {/* 6 Grid Hero Stat Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Tile 1: Total Titles */}
            <div className="group relative bg-zinc-950/80 backdrop-blur-md border border-zinc-900 hover:border-red-500/40 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner group-hover:scale-110 transition-transform">
                  <Film className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-1.5 py-0.5 rounded-md">
                  Katalog
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsCatalogTitles}</p>
                <p className="text-2xl font-black text-white mt-0.5 tracking-tight">{stats.totalMovies}</p>
                <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% bulan ini
                </p>
              </div>
            </div>

            {/* Tile 2: Total Views */}
            <div className="group relative bg-zinc-950/80 backdrop-blur-md border border-zinc-900 hover:border-amber-500/40 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                  Tayangan
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsTotalViews}</p>
                <p className="text-2xl font-black text-white mt-0.5 tracking-tight">{stats.totalViews.toLocaleString()}</p>
                <p className="text-[10px] text-amber-400 font-medium mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Akumulasi Total
                </p>
              </div>
            </div>

            {/* Tile 3: Total Watch Hours */}
            <div className="group relative bg-zinc-950/80 backdrop-blur-md border border-zinc-900 hover:border-emerald-500/40 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                  Waktu
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsWatchHours}</p>
                <p className="text-2xl font-black text-white mt-0.5 tracking-tight">{stats.totalWatchTime.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-400 font-medium mt-1">
                  ~{(stats.totalWatchTime / (stats.totalViews || 1)).toFixed(1)} jam / tayang
                </p>
              </div>
            </div>

            {/* Tile 4: SaaS Users */}
            <div className="group relative bg-zinc-950/80 backdrop-blur-md border border-zinc-900 hover:border-purple-500/40 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded-md">
                  Pengguna
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsSaasSignups}</p>
                <p className="text-2xl font-black text-white mt-0.5 tracking-tight">{stats.totalUsers}</p>
                <p className="text-[10px] text-purple-400 font-medium mt-1">
                  Account Terdaftar
                </p>
              </div>
            </div>

            {/* Tile 5: Active Users Today */}
            <div className="group relative bg-zinc-950/80 backdrop-blur-md border border-zinc-900 hover:border-sky-500/40 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-inner group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" /> Live
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsActiveUsersToday}</p>
                <p className="text-2xl font-black text-white mt-0.5 tracking-tight">{stats.activeUsersToday}</p>
                <p className="text-[10px] text-sky-400 font-medium mt-1">
                  Online Hari Ini
                </p>
              </div>
            </div>

            {/* Tile 6: Monthly Revenue */}
            <div className="group relative bg-zinc-950/80 backdrop-blur-md border border-zinc-900 hover:border-pink-500/40 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-500 shadow-inner group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-pink-400 bg-pink-950/60 border border-pink-500/30 px-1.5 py-0.5 rounded-md">
                  Estimasi MRR
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.cmsMonthlyRevenue}</p>
                <p className="text-xl font-black text-white mt-0.5 tracking-tight">${stats.revenueThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-pink-400 font-medium mt-1">
                  Pendapatan Bulanan
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Charts & Leaderboard Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Audience Traffic Area Chart (2 cols) */}
            <div className="lg:col-span-2 bg-zinc-950/90 border border-zinc-900 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00ADB5]" />
                    {t.cmsAudienceTraffic}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Grafik dinamika trafik penonton dalam 7 hari terakhir</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 font-bold">
                  7 Hari Terakhir
                </span>
              </div>

              {/* Enhanced Interactive Area Bar Chart */}
              <div className="h-52 w-full flex items-end justify-between pt-6 px-2 gap-3 border-b border-zinc-900 pb-3">
                {stats.recentViews.map((item, idx) => {
                  const maxCount = Math.max(...stats.recentViews.map(v => v.count), 1);
                  const percentage = Math.round((item.count / maxCount) * 100);
                  const isHighest = item.count === maxCount;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                      {/* Floating tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 text-white font-mono text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl z-20 pointer-events-none whitespace-nowrap">
                        {item.count.toLocaleString()} views
                      </div>

                      {/* Bar Column */}
                      <div className="w-full max-w-[48px] bg-zinc-900/80 rounded-t-xl relative overflow-hidden transition-all duration-300 h-40 flex items-end p-0.5 border border-zinc-850 group-hover:border-zinc-700">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-700 group-hover:brightness-125 ${
                            isHighest
                              ? "bg-gradient-to-t from-red-600 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                              : "bg-gradient-to-t from-zinc-800 to-[#00ADB5]"
                          }`}
                          style={{ height: `${Math.max(percentage, 8)}%` }}
                        />
                      </div>

                      <span className={`text-[10px] font-mono font-bold ${isHighest ? "text-[#00ADB5]" : "text-zinc-500"}`}>
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-gradient-to-r from-zinc-800 to-[#00ADB5]" />
                  Volume Harian
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-gradient-to-r from-red-600 to-yellow-400" />
                  Peak Highest Traffic
                </span>
              </div>
            </div>

            {/* Engagement Leaderboard (1 col) */}
            <div className="bg-zinc-950/90 border border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" />
                    {t.cmsEngagementLeaders}
                  </h3>
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full uppercase">
                    Top 5
                  </span>
                </div>

                <div className="space-y-3" id="engagement-leaderboard">
                  {stats.topMovies.slice(0, 5).map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                          idx === 0 ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]" :
                          idx === 1 ? "bg-slate-400/20 text-slate-300 border-slate-400/40" :
                          idx === 2 ? "bg-amber-800/20 text-amber-600 border-amber-800/40" :
                          "bg-zinc-900 text-zinc-500 border-zinc-800"
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-800 shrink-0 bg-black">
                          <img src={normalizeCdnUrl((m as any).posterUrl || movies.find(mov => mov.id === m.id)?.posterUrl || "")} alt={m.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-[#00ADB5] transition-colors">
                            {m.title}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {(m as any).genres?.[0] || movies.find(mov => mov.id === m.id)?.genres?.[0] || "General"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <span className="text-xs font-black text-white font-mono">
                          {m.views.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-amber-400 font-bold">
                          ★ {m.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 text-center italic border-t border-zinc-900 pt-3 mt-2">
                Peringkat diperbarui secara otomatis berdasarkan akumulasi views
              </p>
            </div>
          </div>

          {/* Section 3: Genre Donut & Demographic Segmentation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Genre Saturation Donut Chart (2 cols) */}
            <div className="lg:col-span-2 bg-zinc-950/90 border border-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    Genre & Content Distribution
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Sebaran kategori konten aktif dalam katalog platform</p>
                </div>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                  {stats.totalMovies} Total Judul
                </span>
              </div>

              {(() => {
                const totalGenres = stats.genreDistribution.reduce((sum, g) => sum + g.count, 0);
                const chartData = [...stats.genreDistribution]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6);
                
                const palette = [
                  globalSettings.primaryColor || "#DC2626",
                  "#00ADB5", // cyan
                  "#F59E0B", // amber
                  "#10B981", // emerald
                  "#8B5CF6", // purple
                  "#EC4899"  // pink
                ];
                
                let accumulatedPercent = 0;
                
                return (
                  <div className="flex flex-col md:flex-row items-center gap-8 pt-2">
                    {/* SVG Donut */}
                    <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                        {/* Background circle */}
                        <circle
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke="#18181b"
                          strokeWidth="4"
                        />
                        {/* Segment circles */}
                        {chartData.map((item, idx) => {
                          const percent = totalGenres > 0 ? (item.count / totalGenres) * 100 : 0;
                          const strokeDasharray = `${percent} ${100 - percent}`;
                          const strokeDashoffset = 100 - accumulatedPercent;
                          accumulatedPercent += percent;
                          const color = palette[idx % palette.length];
                          
                          return (
                            <circle
                              key={idx}
                              cx="21"
                              cy="21"
                              r="15.915"
                              fill="transparent"
                              stroke={color}
                              strokeWidth="4"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-700 hover:stroke-[5px] cursor-pointer"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute text-center pointer-events-none">
                        <p className="text-3xl font-black text-white tracking-tight">{stats.totalMovies}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Judul Konten</p>
                      </div>
                    </div>

                    {/* Legend and percentage list */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      {chartData.map((item, idx) => {
                        const percent = totalGenres > 0 ? Math.round((item.count / totalGenres) * 100) : 0;
                        const color = palette[idx % palette.length];
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all">
                            <div className="w-3 h-3 rounded-full shrink-0 shadow-md" style={{ backgroundColor: color }} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-200 truncate">{item.name}</span>
                                <span className="font-mono text-zinc-400 font-bold ml-2">{percent}%</span>
                              </div>
                              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Demographics & Segmentation Splits (1 col) */}
            <div className="space-y-6">

              {/* VIP Subscription Split */}
              <div className="bg-zinc-950/90 border border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-black text-white tracking-tight uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    Konversi VIP Premium
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    SaaS VIP
                  </span>
                </h3>

                {(() => {
                  const free = stats.subscriptionSplit?.free || 0;
                  const premium = stats.subscriptionSplit?.premium || 0;
                  const total = free + premium || 1;
                  const premiumPercent = Math.round((premium / total) * 100);
                  const freePercent = 100 - premiumPercent;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                          Gratis ({free})
                        </span>
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                          VIP Premium ({premium})
                        </span>
                      </div>

                      <div className="h-4 w-full bg-zinc-900 rounded-xl overflow-hidden flex p-0.5 border border-zinc-850">
                        <div
                          className="bg-zinc-700 h-full rounded-l-lg transition-all duration-500"
                          style={{ width: `${freePercent}%` }}
                          title={`Free: ${freePercent}%`}
                        />
                        <div
                          className="h-full rounded-r-lg transition-all duration-500"
                          style={{
                            width: `${premiumPercent}%`,
                            backgroundColor: "#F59E0B"
                          }}
                          title={`VIP Premium: ${premiumPercent}%`}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Sebanyak <span className="text-white font-bold">{premiumPercent}%</span> dari total akun telah upgrade ke VIP.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Profile split */}
              <div className="bg-zinc-950/90 border border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-black text-white tracking-tight uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    Profil Demografi Penonton
                  </span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md">
                    Filter Anak
                  </span>
                </h3>

                {(() => {
                  const adult = stats.profileSplit?.adult || 0;
                  const kids = stats.profileSplit?.kids || 0;
                  const total = adult + kids || 1;
                  const adultPercent = Math.round((adult / total) * 100);
                  const kidsPercent = 100 - adultPercent;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-sky-400 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                          Dewasa ({adult})
                        </span>
                        <span className="text-pink-400 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                          Mode Anak ({kids})
                        </span>
                      </div>

                      <div className="h-4 w-full bg-zinc-900 rounded-xl overflow-hidden flex p-0.5 border border-zinc-850">
                        <div
                          className="bg-sky-500 h-full rounded-l-lg transition-all duration-500"
                          style={{ width: `${adultPercent}%` }}
                          title={`Adult Profiles: ${adultPercent}%`}
                        />
                        <div
                          className="bg-pink-500 h-full rounded-r-lg transition-all duration-500"
                          style={{ width: `${kidsPercent}%` }}
                          title={`Kids Mode Profiles: ${kidsPercent}%`}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Terdapat <span className="text-white font-bold">{kidsPercent}%</span> profil dalam Mode Anak.
                      </p>
                    </div>
                  );
                })()}
              </div>

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
                            onClick={() => onSelectMovie && onSelectMovie(m)}
                            className="w-8 h-12 rounded object-cover border border-zinc-800 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                            title="Click to view details"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onSelectMovie && onSelectMovie(m)}
                                className="font-bold text-zinc-200 text-xs hover:text-[#00ADB5] hover:underline transition-colors text-left cursor-pointer"
                                title="Click to view details"
                              >
                                {m.title}
                              </button>
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
                        <option value="movie">{t.cmsSingleMovie || "Single Movie"}</option>
                        <option value="series">{t.cmsTvSeriesShow || "TV Series Show"}</option>
                        <option value="livetv">📺 Live TV Channel</option>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsVideoSourceUrl}</label>
                        <div className="flex items-center gap-3">
                          {videoUrl.includes(".r2.dev") && (
                            <button
                              type="button"
                              onClick={() => setVideoUrl(normalizeCdnUrl(videoUrl))}
                              className="text-[10px] text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                              title="Convert to custom domain cdn.mystreamflix.biz.id"
                            >
                              ⚡ Convert to cdn.mystreamflix.biz.id
                            </button>
                          )}
                          <label className="text-[10px] text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" /> Upload Video to R2
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleGenericFileUpload(e.target.files[0], "videos", (url) => setVideoUrl(url));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. https://cdn.mystreamflix.biz.id/movies/film.mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-video"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsPosterFrameUrl}</label>
                        <label className="text-[10px] text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Upload Poster
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleGenericFileUpload(e.target.files[0], "posters", (url) => setPosterUrl(url), setUploadingPoster);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="url"
                        placeholder="https://cdn.mystreamflix.biz.id/posters/poster.jpg"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs focus:outline-hidden focus:border-red-500/50"
                        id="form-input-poster"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsBackdropUrl}</label>
                        <label className="text-[10px] text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Upload Backdrop
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleGenericFileUpload(e.target.files[0], "backdrops", (url) => setBackdropUrl(url), setUploadingBackdrop);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="url"
                        placeholder="https://cdn.mystreamflix.biz.id/backdrops/backdrop.jpg"
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
                                        type="text"
                                        required
                                        value={ep.videoUrl}
                                        onChange={(e) => handleUpdateEpisode(season.id, ep.id, "videoUrl", e.target.value)}
                                        placeholder="e.g. https://pub-e7ecd47498224d3fbfd74c81dd22c504.r2.dev/series/episode.mp4"
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

                  {/* Subtitles Builder */}
                  <div className="border-t border-zinc-900/80 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Subtitles className="w-4 h-4 text-red-500" />
                          {t.cmsSubtitlesTitle || "Subtitle Captions Configuration"}
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          {t.cmsSubtitlesDesc || "Add subtitle files (.vtt format) for localized text overlays."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSubtitle}
                        className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 border border-red-500/20 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t.cmsAddSubtitle || "Add Subtitle Track"}
                      </button>
                    </div>

                    {subtitles.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-zinc-850 rounded-lg bg-zinc-950/20">
                        <p className="text-[10px] text-zinc-500">{t.none || "None"}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subtitles.map((sub) => (
                          <div key={sub.id} className="bg-zinc-900/30 border border-zinc-900 rounded p-3 space-y-2 relative group/sub">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-zinc-500 font-mono uppercase">
                                SUBTITLE TRACK
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubtitle(sub.id)}
                                className="p-1 text-zinc-700 hover:text-red-500 transition-colors cursor-pointer"
                                title="Remove Subtitle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsSubLangCode || "Lang Code"}</label>
                                <input
                                  type="text"
                                  required
                                  value={sub.language}
                                  onChange={(e) => handleUpdateSubtitle(sub.id, "language", e.target.value)}
                                  placeholder="e.g. id, en, es"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-xs text-zinc-300 focus:outline-hidden focus:border-red-500/30"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsSubLabel || "Label"}</label>
                                <input
                                  type="text"
                                  required
                                  value={sub.label}
                                  onChange={(e) => handleUpdateSubtitle(sub.id, "label", e.target.value)}
                                  placeholder="e.g. Bahasa Indonesia"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-xs text-zinc-300 focus:outline-hidden focus:border-red-500/30"
                                />
                              </div>
                               <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[9px] font-bold uppercase text-zinc-600">{t.cmsSubFileUrl || "Subtitle File URL (.vtt) *"}</label>
                                  <label className="text-[9px] text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5">
                                    <Upload className="w-2.5 h-2.5" /> Upload File
                                    <input
                                      type="file"
                                      accept=".vtt,.srt,text/vtt,text/plain"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleGenericFileUpload(e.target.files[0], "subtitles", (url) => handleUpdateSubtitle(sub.id, "fileUrl", url));
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                                <input
                                  type="url"
                                  required
                                  value={sub.fileUrl}
                                  onChange={(e) => handleUpdateSubtitle(sub.id, "fileUrl", e.target.value)}
                                  placeholder="https://cdn.mystreamflix.biz.id/subtitles/indonesia.vtt"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-xs text-zinc-300 focus:outline-hidden focus:border-red-500/30 font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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

      {/* SUB-TAB VIEWPORT 2.5: LIVE TV CHANNELS MANAGEMENT */}
      {activeSubTab === "livetv" && (
        <div className="space-y-6" id="cms-livetv-panel">
          {/* Live TV Header with Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950 border border-zinc-900 p-5 rounded-xl shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Live TV Channels Management
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Manage HLS (.m3u8) & DASH (.mpd) live streams, station logos, categories, and stream URLs.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Health Check Button */}
              <button
                onClick={runHealthCheck}
                disabled={healthCheckRunning}
                className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition-all cursor-pointer ${
                  healthCheckRunning
                    ? "bg-amber-600/80 text-amber-100 cursor-wait shadow-amber-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                }`}
                id="health-check-all-btn"
              >
                {healthCheckRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span>{healthCheckRunning ? (t?.buffering || "Checking...") : (t?.healthCheckBtn || "Check All Status")}</span>
              </button>

              {/* Add Channel Button */}
              <button
                onClick={handleOpenAddChannel}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                id="add-channel-btn"
              >
                <Plus className="w-4 h-4" />
                <span>{t?.addChannelBtn || "Add Channel"}</span>
              </button>
            </div>
          </div>

          {/* ====== Health Summary Dashboard ====== */}
          {Object.keys(channelHealth).length > 0 && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t?.streamHealthMonitor || "Stream Health Monitor"}</h4>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  {lastHealthCheck && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Last checked: {new Date(lastHealthCheck).toLocaleString()}
                    </span>
                  )}
                  {/* Remove Offline Channels Bulk Action Button */}
                  {Object.values(channelHealth).some(s => s.status === "offline" || s.status === "error") && (
                    <button
                      onClick={handleRemoveOfflineChannels}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer active:scale-95"
                      id="remove-offline-channels-btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Nonaktifkan / Hapus Channel Offline ({Object.values(channelHealth).filter(s => s.status === "offline" || s.status === "error").length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Health stats tiles */}
              {(() => {
                const statuses = Object.values(channelHealth);
                const onlineCount = statuses.filter(s => s.status === "online").length;
                const offlineCount = statuses.filter(s => s.status === "offline").length;
                const errorCount = statuses.filter(s => s.status === "error").length;
                const checkingCount = statuses.filter(s => s.status === "checking").length;
                const total = statuses.length;
                const avgResponseTime = statuses
                  .filter(s => s.responseTime != null)
                  .reduce((sum, s, _, arr) => sum + (s.responseTime || 0) / arr.length, 0);

                return (
                  <div className="mt-3 space-y-3">
                    {/* Progress bar */}
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-zinc-900">
                      {onlineCount > 0 && (
                        <div
                          className="bg-emerald-500 transition-all duration-700"
                          style={{ width: `${(onlineCount / total) * 100}%` }}
                          title={`Online: ${onlineCount}`}
                        />
                      )}
                      {checkingCount > 0 && (
                        <div
                          className="bg-amber-500 animate-pulse transition-all duration-700"
                          style={{ width: `${(checkingCount / total) * 100}%` }}
                          title={`Checking: ${checkingCount}`}
                        />
                      )}
                      {offlineCount > 0 && (
                        <div
                          className="bg-red-500 transition-all duration-700"
                          style={{ width: `${(offlineCount / total) * 100}%` }}
                          title={`Offline: ${offlineCount}`}
                        />
                      )}
                      {errorCount > 0 && (
                        <div
                          className="bg-zinc-600 transition-all duration-700"
                          style={{ width: `${(errorCount / total) * 100}%` }}
                          title={`Error: ${errorCount}`}
                        />
                      )}
                    </div>

                    {/* Stat tiles row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-lg font-black text-emerald-400 leading-none">{onlineCount}</p>
                          <p className="text-[9px] text-emerald-400/60 font-bold uppercase mt-0.5">Online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2.5">
                        <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <p className="text-lg font-black text-red-400 leading-none">{offlineCount}</p>
                          <p className="text-[9px] text-red-400/60 font-bold uppercase mt-0.5">Offline</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-zinc-500/5 border border-zinc-500/20 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-lg font-black text-zinc-400 leading-none">{errorCount}</p>
                          <p className="text-[9px] text-zinc-400/60 font-bold uppercase mt-0.5">Errors</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-sky-500/5 border border-sky-500/20 rounded-lg px-3 py-2.5">
                        <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                          <p className="text-lg font-black text-sky-400 leading-none">{avgResponseTime > 0 ? `${Math.round(avgResponseTime)}ms` : "—"}</p>
                          <p className="text-[9px] text-sky-400/60 font-bold uppercase mt-0.5">{t?.avgLatency || "Avg Latency"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filter Channel Status:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLiveTvStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  liveTvStatusFilter === "all" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Semua Saluran ({movies.filter(m => m.contentType === "livetv" || m.id.startsWith("tv-")).length})
              </button>
              <button
                onClick={() => setLiveTvStatusFilter("online")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  liveTvStatusFilter === "online" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                🟢 Online Only
              </button>
              <button
                onClick={() => setLiveTvStatusFilter("offline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  liveTvStatusFilter === "offline" ? "bg-red-950/80 text-red-300 border border-red-500/40" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                🔴 Offline / Rusak Only
              </button>
            </div>
          </div>

          {/* Live TV Channels Grid Table */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900/90 text-zinc-400 font-extrabold uppercase border-b border-zinc-800 tracking-wider">
                    <th className="py-3.5 px-4">{t?.channelList || "TV Channel"}</th>
                    <th className="py-3.5 px-4">URL Stream (HLS/DASH)</th>
                    <th className="py-3.5 px-4">Format</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Stats</th>
                    <th className="py-3.5 px-4 text-right">{t?.cmsColActions || "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {movies
                    .filter(m => m.contentType === "livetv" || m.id.startsWith("tv-"))
                    .filter(ch => {
                      const status = channelHealth[ch.id]?.status;
                      if (liveTvStatusFilter === "online") return status === "online";
                      if (liveTvStatusFilter === "offline") return status === "offline" || status === "error";
                      return true;
                    })
                    .map((channel) => {
                    const health = channelHealth[channel.id];
                    return (
                    <tr key={channel.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black border border-zinc-800 p-1 shrink-0 flex items-center justify-center overflow-hidden relative">
                            <img 
                              src={normalizeCdnUrl(channel.posterUrl)} 
                              alt={channel.title} 
                              className="w-full h-full object-contain"
                            />
                            {/* Mini status dot overlay */}
                            {health && (
                              <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                                health.status === "online" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" :
                                health.status === "offline" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" :
                                health.status === "checking" ? "bg-amber-400 animate-pulse" :
                                "bg-zinc-500"
                              }`} />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block">{channel.title}</span>
                            <span className="text-[10px] text-zinc-500">{channel.genres.join(", ") || "TV Stream"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-300 max-w-xs truncate">
                        <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800 block truncate" title={channel.videoUrl}>
                          {channel.videoUrl}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-400 uppercase">
                          {channel.videoUrl?.endsWith(".mpd") ? "DASH" : "HLS"}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        {!health ? (
                          <span className="text-[10px] text-zinc-600 italic">Not checked</span>
                        ) : health.status === "checking" ? (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                            <span className="text-[10px] text-amber-400 font-bold">Checking...</span>
                          </div>
                        ) : health.status === "online" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                              <span className="text-[10px] text-emerald-400 font-bold">Online</span>
                              {health.statusCode && (
                                <span className="text-[9px] text-emerald-400/50 font-mono">({health.statusCode})</span>
                              )}
                            </div>
                            {health.responseTime != null && (
                              <span className="text-[9px] text-zinc-500 font-mono block">{health.responseTime}ms</span>
                            )}
                          </div>
                        ) : health.status === "offline" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                              <span className="text-[10px] text-red-400 font-bold">Offline</span>
                              {health.statusCode && (
                                <span className="text-[9px] text-red-400/50 font-mono">({health.statusCode})</span>
                              )}
                            </div>
                            {health.error && (
                              <span className="text-[9px] text-red-400/60 block truncate max-w-[140px]" title={health.error}>{health.error}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-500" />
                            <span className="text-[10px] text-zinc-500 font-bold">Error</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        <span className="block">👁️ {channel.views.toLocaleString()}</span>
                        <span className="block">❤️ {channel.likes.toLocaleString()}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Stream Play Button */}
                          <button
                            onClick={() => setPreviewMovie(channel)}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-[#00ADB5]/20 text-[#00ADB5] border border-zinc-800 transition-colors cursor-pointer"
                            title="Test Stream Play"
                          >
                            <Play className="w-3.5 h-3.5 fill-[#00ADB5]" />
                          </button>
                          <button
                            onClick={() => handleOpenEditChannel(channel)}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                            title="Edit Saluran"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(channel.id)}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                            title="Hapus Saluran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* -------- 📡 IPTV SCANNER & PLAYLIST IMPORTER -------- */}
          <IPTVScanner
            brandColor={brandColor}
            onImportChannel={async (ch) => {
              try {
                const res = await fetch("/api/movies", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: ch.name,
                    description: `Live TV stream — ${ch.group || "General"} — ${ch.country || "International"}`,
                    posterUrl: ch.logo || "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
                    backdropUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1280&q=80",
                    videoUrl: ch.streamUrl,
                    contentType: "livetv",
                    duration: 0,
                    releaseYear: new Date().getFullYear(),
                    rating: 7.0,
                    quality: "Full HD",
                    ageRating: "TV-G",
                    genres: [ch.group || "General"],
                    cast: [],
                    directors: [],
                    country: ch.country || "International",
                    language: ch.language || "en",
                    isFeatured: false,
                    isBanner: false,
                    tier: "free",
                  }),
                });
                if (res.ok) {
                  setSuccessMsg(`✅ "${ch.name}" berhasil diimport ke database!`);
                  onRefreshMovies();
                }
              } catch (e) {
                console.error("Import failed:", e);
              }
            }}
          />

          {/* ====== ADD / EDIT CHANNEL MODAL ====== */}
          {showChannelForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" id="channel-form-overlay">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90svh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                      <Radio className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        {channelFormMode === 'create' ? '+ Tambah Channel TV Baru' : 'Edit Channel TV'}
                      </h3>
                      <p className="text-[10px] text-zinc-500">HLS (.m3u8), DASH (.mpd), atau MP4 stream URL</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowChannelForm(false)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors cursor-pointer" id="channel-form-close-btn">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form id="channel-editor-form" onSubmit={handleSaveChannel} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nama Channel <span className="text-red-500">*</span></label>
                    <input type="text" required placeholder="e.g. TVRI Nasional, MetroTV, Kompas TV" value={channelName} onChange={(e) => setChannelName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors" id="channel-input-name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stream URL (M3U8 / DASH / MP4) <span className="text-red-500">*</span></label>
                    <input type="url" required placeholder="https://example.com/live/stream.m3u8" value={channelStreamUrl} onChange={(e) => setChannelStreamUrl(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors" id="channel-input-stream-url" />
                    <p className="text-[10px] text-zinc-600">Format: .m3u8 (HLS), .mpd (DASH), .mp4</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">URL Logo / Thumbnail</label>
                    <div className="flex gap-2">
                      <input type="url" placeholder="https://example.com/logo.png" value={channelLogoUrl} onChange={(e) => setChannelLogoUrl(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors" id="channel-input-logo" />
                      {channelLogoUrl && (<div className="w-11 h-11 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-zinc-900"><img src={channelLogoUrl} alt="logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>)}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deskripsi</label>
                    <textarea placeholder="Deskripsi singkat channel ini..." value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors resize-none" id="channel-input-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Negara</label>
                      <input type="text" placeholder="Indonesia" value={channelCountry} onChange={(e) => setChannelCountry(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60" id="channel-input-country" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bahasa</label>
                      <input type="text" placeholder="Indonesian" value={channelLanguage} onChange={(e) => setChannelLanguage(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60" id="channel-input-language" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kualitas Stream</label>
                    <select value={channelQuality} onChange={(e) => setChannelQuality(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/60" id="channel-input-quality">
                      <option value="SD">SD (480p)</option>
                      <option value="HD">HD (720p)</option>
                      <option value="Full HD">Full HD (1080p)</option>
                      <option value="4K">4K (Ultra HD)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kategori Channel</label>
                    <div className="flex flex-wrap gap-2">
                      {LIVE_TV_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setChannelCategories((prev) =>
                              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            channelCategories.includes(cat)
                              ? "bg-red-600/15 text-red-200 border-red-500/40"
                              : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {channelCategories.length === 0 && (<p className="text-[10px] text-amber-400">Pilih minimal 1 kategori</p>)}
                  </div>
                </form>
                <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                  <button type="button" onClick={() => setShowChannelForm(false)} className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer" id="channel-form-cancel-btn">Batal</button>
                  <button type="submit" form="channel-editor-form" disabled={channelSaving || !channelName.trim() || !channelStreamUrl.trim() || channelCategories.length === 0} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer shadow-lg" id="channel-form-save-btn">
                    {channelSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {channelSaving ? 'Menyimpan...' : channelFormMode === 'create' ? 'Simpan Channel' : 'Update Channel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* SUB-TAB VIEWPORT 3: SETTINGS */}
      {activeSubTab === "settings" && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6" id="cms-settings-panel">
          {/* Top Save Actions Bar */}
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 p-4 rounded-xl shadow-md">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase">{t.cmsTabSettings}</h3>
              <p className="text-[10px] text-zinc-500">{t.cmsPanelDesc || "Adjust global system-wide settings."}</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-md shadow-lg shadow-red-600/10 cursor-pointer transition-colors"
              id="settings-save-top-btn"
            >
              <Save className="w-3.5 h-3.5" />
              {t.cmsCommitConfig}
            </button>
          </div>

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

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">{t.cmsLogoUploadLabel || "Logo Image (Optional)"}</label>
                
                {settings.logoUrl ? (
                  <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-850 p-3 rounded-lg">
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-center min-w-[60px] h-[40px] max-w-[120px] overflow-hidden">
                      <img src={settings.logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-400 truncate font-mono">{settings.logoUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettingsField("logoUrl", "")}
                      className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-[10px] font-bold text-red-500 rounded-md transition-colors cursor-pointer"
                    >
                      {t.cmsChangeVideo ? t.cmsChangeVideo : "Remove"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      onDragOver={handleLogoDragOver}
                      onDragLeave={handleLogoDragLeave}
                      onDrop={handleLogoDrop}
                      onClick={() => document.getElementById("logo-file-picker")?.click()}
                      className={`relative border border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        draggingLogo 
                          ? "border-red-500 bg-red-500/5" 
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-850/60"
                      }`}
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] text-zinc-400 font-bold">{t.cmsLogoUploadUploading || "Uploading logo..."}</p>
                        </>
                      ) : (
                        <>
                          <Upload className={`w-5 h-5 ${draggingLogo ? "text-red-500 animate-bounce" : "text-zinc-500"}`} />
                          <p className="text-[10px] text-zinc-400 font-bold text-center leading-snug">
                            {t.cmsLogoUploadDragText || "Drag & drop logo file here, or click to browse"}
                          </p>
                          <p className="text-[8px] text-zinc-500">Supports PNG, SVG, JPG (transparent recommended)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      id="logo-file-picker"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
 
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 block">{t.cmsThemeColor}</label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border border-white/20 shadow-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#00ADB5" }}
                  />
                  <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider uppercase bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-md">
                    #00ADB5 (Fixed System Accent)
                  </span>
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

          <form
            onSubmit={handleCreateUser}
            className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end shadow-lg"
          >
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Name</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nama user"
                className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@email.com"
                className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Password</label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as "admin" | "user")}
                className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creatingUser}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-red-600/10 transition-all cursor-pointer disabled:cursor-wait"
            >
              {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{creatingUser ? "Creating..." : "Add User"}</span>
            </button>
          </form>

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
                    usersList.map((usr) => {
                      const isCurrentUser = currentUser?.id === usr.id;
                      return (
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
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-white text-sm">{usr.name}</p>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">
                                    Current
                                  </span>
                                )}
                              </div>
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
                              disabled={isCurrentUser}
                              className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600 disabled:border-zinc-900 text-zinc-300 font-semibold hover:text-white transition-all text-[11px] cursor-pointer disabled:cursor-not-allowed"
                              title={isCurrentUser ? "Current admin role is locked" : "Toggle admin / user role scopes"}
                            >
                              {isCurrentUser ? "Role Locked" : t.cmsToggleRole}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(usr.id)}
                              disabled={isCurrentUser}
                              className="p-1.5 rounded bg-red-600/10 hover:bg-red-600/20 disabled:bg-zinc-950 text-red-500 hover:text-red-400 disabled:text-zinc-700 border border-red-500/10 hover:border-red-500/25 disabled:border-zinc-900 transition-all cursor-pointer disabled:cursor-not-allowed"
                              title={isCurrentUser ? "Cannot delete the current account" : "Delete active member from directories"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                {confirmDialog.title}
              </h3>
              <button
                onClick={() => setConfirmDialog(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  if (cb) cb();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg transition-all cursor-pointer"
              >
                {confirmDialog.actionLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                {confirmDialog.title}
              </h3>
              <button
                onClick={() => setConfirmDialog(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  if (cb) cb();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg transition-all cursor-pointer"
              >
                {confirmDialog.actionLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal Dialog */}
      {alertDialog && alertDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#00ADB5]" />
                {alertDialog.title}
              </h3>
              <button
                onClick={() => setAlertDialog(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {alertDialog.message}
            </p>
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setAlertDialog(null)}
                className="px-5 py-2 text-xs font-bold text-black rounded-lg shadow-lg transition-all cursor-pointer"
                style={{ backgroundColor: "#00ADB5" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Test Preview Modal */}
      {previewMovie && (
        <MediaPlayer
          movie={previewMovie}
          onClose={() => setPreviewMovie(null)}
          t={t}
        />
      )}
    </div>
  );
}
