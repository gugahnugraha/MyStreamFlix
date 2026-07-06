/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import * as dotenv from "dotenv";
import path from "path";
import mongoose, { Schema } from "mongoose";
import { createServer as createViteServer } from "vite";
import { Movie, User, WatchHistoryItem, CMSSettings, DashboardStats, Subtitle, Review } from "./src/types";

dotenv.config();
dotenv.config({ path: ".env.example", override: false });

const movieSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    tmdbId: { type: Number, index: true, sparse: true },
    tmdbMediaType: { type: String, enum: ["movie", "tv"], index: true, sparse: true },
    title: { type: String, required: true, index: true },
    description: String,
    posterUrl: String,
    backdropUrl: String,
    videoUrl: String,
    duration: Number,
    releaseYear: Number,
    rating: Number,
    ageRating: String,
    quality: String,
    genres: [String],
    cast: [String],
    directors: [String],
    subtitles: { type: Array, default: [] },
    country: String,
    language: String,
    views: Number,
    likes: Number,
    isFeatured: Boolean,
    isBanner: Boolean,
    tier: String,
    contentType: { type: String, enum: ["movie", "series"], index: true },
    seasons: { type: Array, default: [] },
    createdAt: String
  },
  { timestamps: true, collection: "movies" }
);

movieSchema.index(
  { tmdbId: 1, tmdbMediaType: 1 },
  { unique: true, sparse: true, partialFilterExpression: { tmdbId: { $type: "number" }, tmdbMediaType: { $exists: true } } }
);

const MongoMovie = (mongoose.models.Movie as mongoose.Model<any>) || mongoose.model<any>("Movie", movieSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;
  let mongoReady = false;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const connectMongo = async () => {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      console.warn("MONGODB_URI is not configured. MongoDB persistence is disabled.");
      return;
    }

    try {
      const dbName = process.env.MONGODB_DB_NAME?.trim() || "mystreamflix";
      await mongoose.connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 8000
      });
      mongoReady = true;
      console.log(`MongoDB Atlas connected (${dbName}).`);
    } catch (error) {
      mongoReady = false;
      console.warn("MongoDB Atlas connection failed. Continuing with in-memory data.", error);
    }
  };

  const persistMovieToMongo = async (movie: Movie) => {
    if (!process.env.MONGODB_URI?.trim()) return;
    if (!mongoReady) throw new Error("MongoDB Atlas is configured but not connected.");
    await MongoMovie.findOneAndUpdate(
      { id: movie.id },
      { $set: movie },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  };

  const deleteMovieFromMongo = async (movieId: string) => {
    if (!process.env.MONGODB_URI?.trim()) return;
    if (!mongoReady) throw new Error("MongoDB Atlas is configured but not connected.");
    await MongoMovie.deleteOne({ id: movieId });
  };

  await connectMongo();

  // ==========================================
  // IN-MEMORY DATABASE & SEED DATA
  // ==========================================

  let users: User[] = [
    {
      id: "usr-1",
      name: "Admin User",
      email: "admin@streamcms.com",
      role: "admin",
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isPremium: true,
      profiles: [
        { id: "prof-1", name: "Admin (Adult)", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", isKids: false },
        { id: "prof-2", name: "Junior (Kids)", avatar: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=150&auto=format&fit=crop&q=80", isKids: true }
      ],
      activeProfileId: "prof-1"
    },
    {
      id: "usr-2",
      name: "Demo Viewer",
      email: "demo@viewer.com",
      role: "user",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isPremium: false,
      profiles: [
        { id: "prof-3", name: "Demo (Adult)", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", isKids: false },
        { id: "prof-4", name: "Kids Mode", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true }
      ],
      activeProfileId: "prof-3"
    }
  ];

  let currentSessionUser: User | null = users[0]; // Auto-logged in as admin for demo simplicity

  let favorites: string[] = ["mov-1", "mov-3"];

  let watchHistory: WatchHistoryItem[] = [
    {
      movieId: "mov-1",
      progress: 320,
      duration: 596,
      lastWatched: new Date().toISOString()
    },
    {
      movieId: "mov-2",
      progress: 45,
      duration: 893,
      lastWatched: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  let cmsSettings: CMSSettings = {
    siteName: "FlixSphere",
    logoText: "FLIXSPHERE",
    primaryColor: "#E50914", // Netflix Red
    enableComments: true,
    enableRatings: true,
    maintenanceMode: false,
    seoTitle: "FlixSphere - Premium Movie Streaming CMS & Portal",
    seoDescription: "Watch movies, TV series, anime, and documentations online in pristine 4K quality with dynamic subtitle capabilities.",
    seoKeywords: "streaming, cms, nextjs, react, express, movies, premium, cinema"
  };

  const sampleSubtitles: Subtitle[] = [
    { id: "sub-1", language: "en", label: "English", fileUrl: "" },
    { id: "sub-2", language: "es", label: "Español", fileUrl: "" },
    { id: "sub-3", language: "fr", label: "Français", fileUrl: "" },
    { id: "sub-4", language: "id", label: "Bahasa Indonesia", fileUrl: "" }
  ];

  let movies: Movie[] = [
    {
      id: "mov-1",
      title: "Big Buck Bunny",
      description: "A large and lovable rabbit deals with three mischievous forest rodents who bully him and ruin his day. After they take things too far, he orchestrates a complex and hilarious revenge trap.",
      posterUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 10,
      releaseYear: 2022,
      rating: 8.4,
      ageRating: "G",
      quality: "4K",
      genres: ["Animation", "Comedy", "Family"],
      cast: ["Bunny", "Franky", "Rinky", "Gimera"],
      directors: ["Sacha Goedegebure"],
      subtitles: sampleSubtitles,
      country: "Netherlands",
      language: "English",
      views: 18450,
      likes: 3940,
      isFeatured: true,
      isBanner: true,
      createdAt: new Date(Date.now() - 100000000).toISOString(),
      tier: "free",
      contentType: "movie"
    },
    {
      id: "mov-2",
      title: "Sintel: Path of the Dragon",
      description: "A lonely young woman named Sintel rescues and bonds with a baby dragon whom she names Scales. When the dragon is snatched by an adult dragon, Sintel embarks on a long and perilous quest to find her companion.",
      posterUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      duration: 15,
      releaseYear: 2023,
      rating: 9.1,
      ageRating: "PG-13",
      quality: "Ultra HD",
      genres: ["Fantasy", "Animation", "Drama"],
      cast: ["Sintel", "Scales", "The Shaman"],
      directors: ["Colin Levy"],
      subtitles: sampleSubtitles,
      country: "United States",
      language: "Dutch",
      views: 24900,
      likes: 6200,
      isFeatured: true,
      isBanner: true,
      createdAt: new Date(Date.now() - 200000000).toISOString(),
      tier: "premium",
      contentType: "movie"
    },
    {
      id: "mov-3",
      title: "Tears of Steel",
      description: "Set in a dystopian future in Amsterdam, a group of scientists attempts to rescue the world from giant destructive robots by using technology to explore a past relationship failure that triggered the apocalypse.",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: 12,
      releaseYear: 2021,
      rating: 7.9,
      ageRating: "PG-13",
      quality: "Full HD",
      genres: ["Sci-Fi", "Action", "Cyberpunk"],
      cast: ["Derek de Lint", "Rogier Schippers", "Denise Rebergen"],
      directors: ["Ian Hubert"],
      subtitles: sampleSubtitles.slice(0, 2),
      country: "Netherlands",
      language: "English",
      views: 12400,
      likes: 2150,
      isFeatured: false,
      isBanner: true,
      createdAt: new Date(Date.now() - 300000000).toISOString(),
      tier: "vip",
      contentType: "movie"
    },
    {
      id: "mov-4",
      title: "Elephants Dream",
      description: "Two characters, Proog and Emo, explore a giant, chaotic, and surreal machine world that seems to operate on bizarre logic, leading to a psychological rift between their perspectives on reality.",
      posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: 11,
      releaseYear: 2019,
      rating: 8.0,
      ageRating: "G",
      quality: "HD",
      genres: ["Animation", "Sci-Fi", "Surreal"],
      cast: ["Proog", "Emo"],
      directors: ["Bassam Kurdali"],
      subtitles: sampleSubtitles.slice(0, 1),
      country: "Germany",
      language: "English",
      views: 9400,
      likes: 1280,
      isFeatured: false,
      isBanner: false,
      createdAt: new Date(Date.now() - 400000000).toISOString(),
      tier: "free",
      contentType: "movie"
    },
    {
      id: "mov-5",
      title: "Subaru: For Bigger Blazes",
      description: "A fast-paced high-octane cinematic showcase of high-end motorsport driving, showcasing vehicle performance under extreme rally track environments.",
      posterUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: 5,
      releaseYear: 2024,
      rating: 8.6,
      ageRating: "PG",
      quality: "4K",
      genres: ["Action", "Documentary", "Sports"],
      cast: ["Professional Driver"],
      directors: ["Racing Productions"],
      subtitles: [],
      country: "Japan",
      language: "Japanese",
      views: 31200,
      likes: 9810,
      isFeatured: true,
      isBanner: false,
      createdAt: new Date(Date.now() - 50000000).toISOString(),
      tier: "premium",
      contentType: "movie"
    },
    {
      id: "mov-6",
      title: "The Blender Cosmic Saga",
      description: "Explore the depths of standard 3D generated sci-fi universes. Follow Emo, Sintel, and Tears of Steel characters as they unite in a multi-season cosmic crossover to prevent the robot uprising.",
      posterUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: 45,
      releaseYear: 2025,
      rating: 9.3,
      ageRating: "PG-13",
      quality: "4K",
      genres: ["Sci-Fi", "Action", "Animation"],
      cast: ["Derek de Lint", "Sintel", "Emo"],
      directors: ["Colin Levy", "Ian Hubert"],
      subtitles: sampleSubtitles,
      country: "Netherlands",
      language: "English",
      views: 45200,
      likes: 15900,
      isFeatured: true,
      isBanner: false,
      createdAt: new Date(Date.now() - 40000000).toISOString(),
      tier: "free",
      contentType: "series",
      seasons: [
        {
          id: "tv-1-s1",
          seasonNumber: 1,
          title: "Season 1: Cyber Heist",
          episodes: [
            {
              id: "tv-1-s1-e1",
              episodeNumber: 1,
              title: "A World of Steel",
              duration: 12,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
              description: "Scientists discover a temporal rift in Amsterdam containing giant robot blueprints from a broken past relationship."
            },
            {
              id: "tv-1-s1-e2",
              episodeNumber: 2,
              title: "Dreaming of Elephants",
              duration: 11,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              description: "Emo and Proog travel inside the machine world core to recover the decryption keys."
            }
          ]
        },
        {
          id: "tv-1-s2",
          seasonNumber: 2,
          title: "Season 2: Dragon's Legacy",
          episodes: [
            {
              id: "tv-1-s2-e1",
              episodeNumber: 1,
              title: "Sintel's Rescue Mission",
              duration: 15,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
              description: "Sintel scales the dangerous ancient mountain peak to rescue her stolen companion Scales."
            }
          ]
        }
      ]
    },
    {
      id: "mov-7",
      title: "Wilderness Chronicles",
      description: "Immerse yourself in stunning portraits of nature, majestic forest creatures, and natural speed tracks around the globe.",
      posterUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 30,
      releaseYear: 2026,
      rating: 8.8,
      ageRating: "G",
      quality: "Ultra HD",
      genres: ["Documentary", "Family", "Animation"],
      cast: ["David Attenborough Style Narrator"],
      directors: ["Earth Documentaries"],
      subtitles: sampleSubtitles,
      country: "United Kingdom",
      language: "English",
      views: 22300,
      likes: 4800,
      isFeatured: false,
      isBanner: false,
      createdAt: new Date(Date.now() - 30000000).toISOString(),
      tier: "vip",
      contentType: "series",
      seasons: [
        {
          id: "tv-2-s1",
          seasonNumber: 1,
          title: "Season 1: Forest Dynasties",
          episodes: [
            {
              id: "tv-2-s1-e1",
              episodeNumber: 1,
              title: "Rise of the Bunny",
              duration: 10,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              description: "Explore the life of the big rabbit and the complex traps he crafts in the heart of the forest."
            },
            {
              id: "tv-2-s1-e2",
              episodeNumber: 2,
              title: "The High Octane Rally",
              duration: 5,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              description: "A close-up look at how modern vehicles test high rally curves inside forest and mountain terrains."
            }
          ]
        }
      ]
    }
  ];

  let movieReviews: Record<string, Review[]> = {
    "mov-1": [
      { id: "rev-1", userName: "Moviebuff99", rating: 9, comment: "An outstanding and charming animated masterpiece. Beautiful lighting and brilliant character work!", date: "2026-06-15" },
      { id: "rev-2", userName: "CinematicWhiz", rating: 8, comment: "Extremely funny and very well orchestrated. Perfect demo content for 4K setups.", date: "2026-06-20" }
    ],
    "mov-2": [
      { id: "rev-3", userName: "FantasyLover", rating: 10, comment: "Deeply emotional story and spectacular art direction. The dragon flight scenes are magical.", date: "2026-06-25" }
    ]
  };

  // ==========================================
  // MIDDLEWARE / SECURITY UTILS
  // ==========================================

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!currentSessionUser || currentSessionUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    next();
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!currentSessionUser) {
      return res.status(410).json({ error: "Authentication required." });
    }
    next();
  };

  const getTmdbApiKey = () => {
    const key = process.env.TMDB_API_KEY?.trim();
    if (!key || key === "MY_TMDB_API_KEY") return "";
    return key;
  };

  const tmdbImage = (pathValue?: string | null, size = "w185") => {
    return pathValue ? `https://image.tmdb.org/t/p/${size}${pathValue}` : "";
  };

  const searchTmdbMulti = async (query: string) => {
    const apiKey = getTmdbApiKey();
    if (!apiKey) return [];

    const params = new URLSearchParams({
      api_key: apiKey,
      query,
      include_adult: "false",
      language: "en-US",
      page: "1"
    });

    const response = await fetch(`https://api.themoviedb.org/3/search/multi?${params.toString()}`);
    if (!response.ok) {
      console.warn(`TMDB search failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.results || [])
      .filter((item: any) => ["movie", "tv", "person"].includes(item.media_type))
      .slice(0, 8)
      .map((item: any) => {
        if (item.media_type === "person") {
          const knownFor = (item.known_for || [])
            .map((entry: any) => entry.title || entry.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(", ");

          return {
            id: `tmdb-person-${item.id}`,
            tmdbId: item.id,
            source: "tmdb",
            type: "cast",
            title: item.name,
            subtitle: knownFor ? `Cast • ${knownFor}` : "Cast",
            posterUrl: tmdbImage(item.profile_path),
            query: item.name
          };
        }

        const isMovie = item.media_type === "movie";
        const title = isMovie ? item.title : item.name;
        const dateValue = isMovie ? item.release_date : item.first_air_date;
        const year = dateValue ? new Date(dateValue).getFullYear() : "";

        return {
          id: `tmdb-${item.media_type}-${item.id}`,
          tmdbId: item.id,
          source: "tmdb",
          type: isMovie ? "movie" : "series",
          title,
          subtitle: `${isMovie ? "Movie" : "TV Series"}${year ? ` • ${year}` : ""}`,
          posterUrl: tmdbImage(item.poster_path),
          backdropUrl: tmdbImage(item.backdrop_path, "w780"),
          query: title
        };
      });
  };

  const getLanguageName = (code?: string) => {
    if (!code) return "English";
    try {
      const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
      return displayNames.of(code) || code.toUpperCase();
    } catch {
      return code.toUpperCase();
    }
  };

  const getMovieCertification = (releaseDates: any) => {
    const usRelease = releaseDates?.results?.find((item: any) => item.iso_3166_1 === "US");
    const certification = usRelease?.release_dates?.find((item: any) => item.certification)?.certification;
    return certification || "PG-13";
  };

  const getTvCertification = (contentRatings: any) => {
    const usRating = contentRatings?.results?.find((item: any) => item.iso_3166_1 === "US");
    return usRating?.rating || "PG-13";
  };

  const fetchTmdbMetadata = async (mediaType: "movie" | "tv", tmdbId: string) => {
    const apiKey = getTmdbApiKey();
    if (!apiKey) throw new Error("TMDB_API_KEY is not configured.");

    const append = mediaType === "movie" ? "credits,release_dates" : "credits,content_ratings";
    const params = new URLSearchParams({
      api_key: apiKey,
      append_to_response: append,
      language: "en-US"
    });

    const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`TMDB metadata lookup failed with status ${response.status}.`);
    }

    const data = await response.json();
    const isMovie = mediaType === "movie";
    const title = isMovie ? data.title : data.name;
    const dateValue = isMovie ? data.release_date : data.first_air_date;
    const directors = isMovie
      ? (data.credits?.crew || [])
          .filter((person: any) => person.job === "Director")
          .map((person: any) => person.name)
      : [
          ...(data.created_by || []).map((person: any) => person.name),
          ...(data.credits?.crew || [])
            .filter((person: any) => person.job === "Director" || person.job === "Executive Producer")
            .map((person: any) => person.name)
        ];

    return {
      tmdbId: data.id,
      tmdbMediaType: mediaType,
      contentType: isMovie ? "movie" : "series",
      title,
      description: data.overview || "",
      posterUrl: tmdbImage(data.poster_path, "w500"),
      backdropUrl: tmdbImage(data.backdrop_path, "w1280"),
      duration: isMovie ? (data.runtime || 120) : (data.episode_run_time?.[0] || 45),
      releaseYear: dateValue ? new Date(dateValue).getFullYear() : new Date().getFullYear(),
      rating: data.vote_average ? Number(data.vote_average.toFixed(1)) : 7.5,
      ageRating: isMovie ? getMovieCertification(data.release_dates) : getTvCertification(data.content_ratings),
      genres: (data.genres || []).map((genre: any) => genre.name),
      cast: (data.credits?.cast || []).slice(0, 10).map((person: any) => person.name),
      directors: Array.from(new Set(directors.filter(Boolean))).slice(0, 5),
      country: data.production_countries?.[0]?.name || data.origin_country?.[0] || "United States",
      language: getLanguageName(data.original_language),
      seasonsCount: data.number_of_seasons || 1,
      episodesPerSeason: data.number_of_episodes && data.number_of_seasons
        ? Math.max(1, Math.round(data.number_of_episodes / data.number_of_seasons))
        : 5,
      seasons: !isMovie && Array.isArray(data.seasons)
        ? data.seasons
            .filter((season: any) => season.season_number > 0)
            .slice(0, 8)
            .map((season: any) => ({
              id: `tmdb-s${season.season_number}-${Date.now()}`,
              seasonNumber: season.season_number,
              title: season.name || `Season ${season.season_number}`,
              episodes: Array.from({ length: Math.min(season.episode_count || 1, 12) }, (_, idx) => ({
                id: `tmdb-s${season.season_number}-e${idx + 1}-${Date.now()}`,
                episodeNumber: idx + 1,
                title: `Episode ${idx + 1}`,
                duration: data.episode_run_time?.[0] || 45,
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                description: ""
              }))
            }))
        : []
    };
  };

  const normalizeTitleKey = (value?: string) => {
    return (value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
  };

  const findDuplicateMovie = (movieData: Partial<Movie>, ignoreId?: string) => {
    const incomingTmdbId = movieData.tmdbId !== undefined ? Number(movieData.tmdbId) : undefined;
    const incomingMediaType = movieData.tmdbMediaType || (movieData.contentType === "series" ? "tv" : "movie");
    const incomingType = movieData.contentType || (incomingMediaType === "tv" ? "series" : "movie");
    const incomingTitleKey = normalizeTitleKey(movieData.title);
    const incomingYear = Number(movieData.releaseYear) || undefined;

    return movies.find((movie) => {
      if (ignoreId && movie.id === ignoreId) return false;

      if (incomingTmdbId && movie.tmdbId && Number(movie.tmdbId) === incomingTmdbId) {
        const movieMediaType = movie.tmdbMediaType || (movie.contentType === "series" ? "tv" : "movie");
        return movieMediaType === incomingMediaType;
      }

      return (
        incomingTitleKey.length > 0 &&
        normalizeTitleKey(movie.title) === incomingTitleKey &&
        movie.contentType === incomingType &&
        (!incomingYear || movie.releaseYear === incomingYear)
      );
    });
  };

  const escapeRegex = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const findDuplicateMovieInMongo = async (movieData: Partial<Movie>, ignoreId?: string) => {
    if (!mongoReady) return null;

    const incomingTmdbId = movieData.tmdbId !== undefined ? Number(movieData.tmdbId) : undefined;
    const incomingMediaType = movieData.tmdbMediaType || (movieData.contentType === "series" ? "tv" : "movie");
    const incomingType = movieData.contentType || (incomingMediaType === "tv" ? "series" : "movie");
    const incomingYear = Number(movieData.releaseYear) || undefined;
    const clauses: any[] = [];

    if (incomingTmdbId) {
      clauses.push({ tmdbId: incomingTmdbId, tmdbMediaType: incomingMediaType });
    }

    if (movieData.title) {
      clauses.push({
        title: new RegExp(`^${escapeRegex(movieData.title.trim())}$`, "i"),
        contentType: incomingType,
        ...(incomingYear ? { releaseYear: incomingYear } : {})
      });
    }

    if (clauses.length === 0) return null;

    const existing = await MongoMovie.findOne({
      $and: [
        { $or: clauses },
        ...(ignoreId ? [{ id: { $ne: ignoreId } }] : [])
      ]
    }).lean();

    return existing as Movie | null;
  };

  // ==========================================
  // AUTH API ENDPOINTS
  // ==========================================

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (user) {
      currentSessionUser = user;
      return res.json({ success: true, user });
    }
    // Simple mock credential fallback
    if (email === "admin@streamcms.com") {
      currentSessionUser = users[0];
      return res.json({ success: true, user: users[0] });
    }
    // Create quick viewer account if not exists
    const newUser: User = {
      id: `usr-${users.length + 1}`,
      name: email.split("@")[0],
      email: email,
      role: "user",
      createdAt: new Date().toISOString(),
      isPremium: false,
      profiles: [
        { id: `prof-${Date.now()}-1`, name: email.split("@")[0], avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", isKids: false },
        { id: `prof-${Date.now()}-2`, name: "Kids Zone", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true }
      ],
      activeProfileId: `prof-${Date.now()}-1`
    };
    users.push(newUser);
    currentSessionUser = newUser;
    res.json({ success: true, user: newUser });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email } = req.body;
    const existing = users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered." });
    }
    const newUser: User = {
      id: `usr-${users.length + 1}`,
      name,
      email,
      role: "user",
      createdAt: new Date().toISOString(),
      isPremium: false,
      profiles: [
        { id: `prof-${Date.now()}-1`, name: name, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", isKids: false },
        { id: `prof-${Date.now()}-2`, name: "Kids Zone", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true }
      ],
      activeProfileId: `prof-${Date.now()}-1`
    };
    users.push(newUser);
    currentSessionUser = newUser;
    res.json({ success: true, user: newUser });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: currentSessionUser });
  });

  app.post("/api/auth/logout", (req, res) => {
    currentSessionUser = null;
    res.json({ success: true });
  });

  // Upgrade user to Premium (simulating Hotstar/Prime paywall unlock)
  app.post("/api/auth/subscribe", requireAuth, (req, res) => {
    if (currentSessionUser) {
      currentSessionUser.isPremium = true;
      const uIdx = users.findIndex(u => u.id === currentSessionUser!.id);
      if (uIdx !== -1) users[uIdx].isPremium = true;
      return res.json({ success: true, user: currentSessionUser });
    }
    res.status(400).json({ error: "No active user logged in." });
  });

  // Switch active profile
  app.post("/api/auth/profile/switch", requireAuth, (req, res) => {
    const { profileId } = req.body;
    if (currentSessionUser) {
      const profileExists = currentSessionUser.profiles?.some(p => p.id === profileId);
      if (!profileExists) {
        return res.status(404).json({ error: "Profile not found for this user." });
      }
      currentSessionUser.activeProfileId = profileId;
      const uIdx = users.findIndex(u => u.id === currentSessionUser!.id);
      if (uIdx !== -1) users[uIdx].activeProfileId = profileId;
      return res.json({ success: true, user: currentSessionUser });
    }
    res.status(400).json({ error: "No active user logged in." });
  });

  // Create profile
  app.post("/api/auth/profile/create", requireAuth, (req, res) => {
    const { name, avatar, isKids } = req.body;
    if (!name) return res.status(400).json({ error: "Profile name is required." });

    if (currentSessionUser) {
      if (!currentSessionUser.profiles) currentSessionUser.profiles = [];
      if (currentSessionUser.profiles.length >= 5) {
        return res.status(400).json({ error: "Maximum limit of 5 profiles reached." });
      }

      const newProfile = {
        id: `prof-${Date.now()}`,
        name,
        avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isKids: !!isKids
      };

      currentSessionUser.profiles.push(newProfile);
      const uIdx = users.findIndex(u => u.id === currentSessionUser!.id);
      if (uIdx !== -1) users[uIdx].profiles = currentSessionUser.profiles;

      return res.json({ success: true, user: currentSessionUser });
    }
    res.status(400).json({ error: "No active user logged in." });
  });

  // Delete profile
  app.delete("/api/auth/profile/:profileId", requireAuth, (req, res) => {
    const { profileId } = req.params;
    if (currentSessionUser) {
      if (!currentSessionUser.profiles) return res.status(404).json({ error: "No profiles found." });
      
      const filtered = currentSessionUser.profiles.filter(p => p.id !== profileId);
      if (filtered.length === currentSessionUser.profiles.length) {
        return res.status(404).json({ error: "Profile not found." });
      }
      if (filtered.length === 0) {
        return res.status(400).json({ error: "Must keep at least one profile active." });
      }

      currentSessionUser.profiles = filtered;
      // If deleted profile was active, auto-select the first one
      if (currentSessionUser.activeProfileId === profileId) {
        currentSessionUser.activeProfileId = filtered[0].id;
      }

      const uIdx = users.findIndex(u => u.id === currentSessionUser!.id);
      if (uIdx !== -1) {
        users[uIdx].profiles = filtered;
        users[uIdx].activeProfileId = currentSessionUser.activeProfileId;
      }

      return res.json({ success: true, user: currentSessionUser });
    }
    res.status(400).json({ error: "No active user logged in." });
  });

  // Toggle quick user roles for testing convenience in preview
  app.post("/api/auth/toggle-role", (req, res) => {
    if (currentSessionUser) {
      currentSessionUser.role = currentSessionUser.role === "admin" ? "user" : "admin";
      // Sync in user database
      const uIdx = users.findIndex(u => u.id === currentSessionUser!.id);
      if (uIdx !== -1) users[uIdx].role = currentSessionUser.role;
      return res.json({ success: true, user: currentSessionUser });
    }
    res.status(400).json({ error: "No active user logged in." });
  });

  // ==========================================
  // USER BASE MANAGEMENT API ENDPOINTS (ADMIN ONLY)
  // ==========================================

  app.get("/api/users", requireAdmin, (req, res) => {
    res.json(users);
  });

  app.put("/api/users/:id/role", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ error: "Invalid role specified." });
    }
    
    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    user.role = role;
    
    if (currentSessionUser && currentSessionUser.id === id) {
      currentSessionUser.role = role;
    }
    
    res.json({ success: true, user });
  });

  app.delete("/api/users/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    if (currentSessionUser && currentSessionUser.id === id) {
      return res.status(400).json({ error: "Cannot delete your own active session account." });
    }
    
    const uIdx = users.findIndex(u => u.id === id);
    if (uIdx === -1) {
      return res.status(404).json({ error: "User not found." });
    }
    
    const deleted = users.splice(uIdx, 1)[0];
    res.json({ success: true, deletedId: deleted.id });
  });

  // ==========================================
  // MOVIE CATALOG API ENDPOINTS (READ / WRITE / SEARCH)
  // ==========================================

  app.get("/api/tmdb/search", requireAdmin, async (req, res) => {
    const query = String(req.query.q || req.query.query || "").trim();
    const contentType = String(req.query.contentType || "all");
    if (!query) return res.json([]);

    try {
      const results = await searchTmdbMulti(query);
      const filtered = results.filter((item: any) => {
        if (contentType === "movie") return item.type === "movie";
        if (contentType === "series") return item.type === "series";
        return item.type === "movie" || item.type === "series";
      }).map((item: any) => {
        const mediaType = item.type === "series" ? "tv" : "movie";
        const existing = movies.find((movie) => movie.tmdbId === item.tmdbId && (movie.tmdbMediaType || (movie.contentType === "series" ? "tv" : "movie")) === mediaType);
        return {
          ...item,
          alreadyImported: !!existing,
          existingMovieId: existing?.id
        };
      });
      res.json(filtered);
    } catch (error: any) {
      res.status(502).json({ error: error.message || "TMDB search failed." });
    }
  });

  app.get("/api/tmdb/metadata", requireAdmin, async (req, res) => {
    const tmdbId = String(req.query.id || "");
    const mediaTypeParam = String(req.query.mediaType || req.query.type || "");
    const mediaType = mediaTypeParam === "series" ? "tv" : mediaTypeParam;

    if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
      return res.status(400).json({ error: "Valid TMDB id and mediaType are required." });
    }

    try {
      const metadata = await fetchTmdbMetadata(mediaType as "movie" | "tv", tmdbId);
      res.json(metadata);
    } catch (error: any) {
      res.status(502).json({ error: error.message || "TMDB metadata lookup failed." });
    }
  });

  app.get("/api/search/suggestions", async (req, res) => {
    const query = String(req.query.q || req.query.query || "").trim();
    if (!query) return res.json([]);

    const q = query.toLowerCase();
    const localTitleMatches = movies
      .filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q)) ||
        m.directors.some(d => d.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map(m => ({
        id: `local-title-${m.id}`,
        movieId: m.id,
        source: "local",
        type: m.contentType === "series" ? "series" : "movie",
        title: m.title,
        subtitle: `${m.contentType === "series" ? "TV Series" : "Movie"} • ${m.releaseYear}`,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        query: m.title
      }));

    const castNames = new Map<string, string[]>();
    movies.forEach((movie) => {
      movie.cast
        .filter(name => name.toLowerCase().includes(q))
        .forEach((name) => {
          const titles = castNames.get(name) || [];
          castNames.set(name, [...titles, movie.title].slice(0, 2));
        });
    });

    const localCastMatches = Array.from(castNames.entries()).slice(0, 4).map(([name, titles]) => ({
      id: `local-cast-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      source: "local",
      type: "cast",
      title: name,
      subtitle: `Cast • ${titles.join(", ")}`,
      posterUrl: "",
      query: name
    }));

    let tmdbMatches: any[] = [];
    try {
      tmdbMatches = await searchTmdbMulti(query);
    } catch (error) {
      console.warn("TMDB suggestion lookup failed:", error);
    }

    const unique = new Map<string, any>();
    [...localTitleMatches, ...localCastMatches, ...tmdbMatches].forEach((item) => {
      const key = `${item.type}-${item.title}`.toLowerCase();
      if (!unique.has(key)) unique.set(key, item);
    });

    res.json(Array.from(unique.values()).slice(0, 12));
  });

  app.get("/api/movies", (req, res) => {
    const { genre, search, sortBy, contentType } = req.query;
    let filteredMovies = [...movies];

    if (contentType && contentType !== "all") {
      filteredMovies = filteredMovies.filter(m => m.contentType === contentType);
    }

    if (genre && genre !== "All") {
      filteredMovies = filteredMovies.filter(m => 
        m.genres.some(g => g.toLowerCase() === (genre as string).toLowerCase())
      );
    }

    if (search) {
      const q = (search as string).toLowerCase();
      filteredMovies = filteredMovies.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.description.toLowerCase().includes(q) ||
        m.directors.some(d => d.toLowerCase().includes(q))
      );
    }

    if (sortBy === "rating") {
      filteredMovies.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "year") {
      filteredMovies.sort((a, b) => b.releaseYear - a.releaseYear);
    } else if (sortBy === "views") {
      filteredMovies.sort((a, b) => b.views - a.views);
    } else {
      // Default: newly added
      filteredMovies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(filteredMovies);
  });

  app.get("/api/movies/:id", (req, res) => {
    const movie = movies.find(m => m.id === req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    // Increment views safely on retrieval
    movie.views += 1;
    const reviews = movieReviews[movie.id] || [];
    res.json({ ...movie, reviews });
  });

  // Admin CRUD: Create
  app.post("/api/movies", requireAdmin, async (req, res) => {
    const movieData: Partial<Movie> = req.body;
    if (!movieData.title || !movieData.videoUrl) {
      return res.status(400).json({ error: "Title and Video URL are required." });
    }

    const duplicate = findDuplicateMovie(movieData) || await findDuplicateMovieInMongo(movieData);
    if (duplicate) {
      return res.status(409).json({
        error: `"${duplicate.title}" is already in the catalog database.`,
        duplicateId: duplicate.id,
        duplicateTitle: duplicate.title
      });
    }

    const newMovie: Movie = {
      id: `mov-${movies.length + 1}`,
      tmdbId: movieData.tmdbId !== undefined ? Number(movieData.tmdbId) : undefined,
      tmdbMediaType: movieData.tmdbMediaType || (movieData.contentType === "series" ? "tv" : movieData.tmdbId ? "movie" : undefined),
      title: movieData.title,
      description: movieData.description || "",
      posterUrl: movieData.posterUrl || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80",
      backdropUrl: movieData.backdropUrl || "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=1200&auto=format&fit=crop&q=80",
      videoUrl: movieData.videoUrl,
      duration: Number(movieData.duration) || 120,
      releaseYear: Number(movieData.releaseYear) || new Date().getFullYear(),
      rating: Number(movieData.rating) || 7.0,
      ageRating: movieData.ageRating || "PG-13",
      quality: movieData.quality || "Full HD",
      genres: movieData.genres || ["Drama"],
      cast: movieData.cast || [],
      directors: movieData.directors || [],
      subtitles: movieData.subtitles || [],
      country: movieData.country || "United States",
      language: movieData.language || "English",
      views: 0,
      likes: 0,
      isFeatured: movieData.isFeatured || false,
      isBanner: movieData.isBanner || false,
      tier: movieData.tier || "free",
      contentType: movieData.contentType || "movie",
      seasons: movieData.seasons || [],
      createdAt: new Date().toISOString()
    };

    movies.push(newMovie);
    try {
      await persistMovieToMongo(newMovie);
      res.status(201).json(newMovie);
    } catch (error: any) {
      movies = movies.filter((movie) => movie.id !== newMovie.id);
      if (error?.code === 11000) {
        return res.status(409).json({ error: `"${newMovie.title}" is already in MongoDB Atlas.` });
      }
      return res.status(502).json({ error: error.message || "Movie saved locally but failed to persist to MongoDB Atlas." });
    }
  });

  // Admin CRUD: Update
  app.put("/api/movies/:id", requireAdmin, async (req, res) => {
    const mIdx = movies.findIndex(m => m.id === req.params.id);
    if (mIdx === -1) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const original = movies[mIdx];
    const updateData = req.body;
    const duplicate = findDuplicateMovie(updateData, original.id) || await findDuplicateMovieInMongo(updateData, original.id);
    if (duplicate) {
      return res.status(409).json({
        error: `"${duplicate.title}" is already in the catalog database.`,
        duplicateId: duplicate.id,
        duplicateTitle: duplicate.title
      });
    }

    const updatedMovie = {
      ...original,
      ...updateData,
      // Ensure specific types are maintained
      id: original.id,
      duration: updateData.duration !== undefined ? Number(updateData.duration) : original.duration,
      releaseYear: updateData.releaseYear !== undefined ? Number(updateData.releaseYear) : original.releaseYear,
      rating: updateData.rating !== undefined ? Number(updateData.rating) : original.rating,
      contentType: updateData.contentType || original.contentType,
      tmdbId: updateData.tmdbId !== undefined && updateData.tmdbId !== "" ? Number(updateData.tmdbId) : original.tmdbId,
      tmdbMediaType: updateData.tmdbMediaType || original.tmdbMediaType,
      seasons: updateData.seasons || original.seasons,
    };

    movies[mIdx] = updatedMovie;

    try {
      await persistMovieToMongo(updatedMovie);
      res.json(movies[mIdx]);
    } catch (error: any) {
      movies[mIdx] = original;
      if (error?.code === 11000) {
        return res.status(409).json({ error: `"${updatedMovie.title}" is already in MongoDB Atlas.` });
      }
      res.status(502).json({ error: error.message || "Movie updated locally but failed to persist to MongoDB Atlas." });
    }
  });

  // Admin CRUD: Delete
  app.delete("/api/movies/:id", requireAdmin, async (req, res) => {
    const mIdx = movies.findIndex(m => m.id === req.params.id);
    if (mIdx === -1) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const deleted = movies.splice(mIdx, 1)[0];
    try {
      await deleteMovieFromMongo(deleted.id);
      res.json({ success: true, deletedId: deleted.id });
    } catch (error: any) {
      movies.splice(mIdx, 0, deleted);
      res.status(502).json({ error: error.message || "Movie deleted locally but failed to delete from MongoDB Atlas." });
    }
  });

  // Submit Review
  app.post("/api/movies/:id/reviews", requireAuth, (req, res) => {
    const { rating, comment } = req.body;
    const movie = movies.find(m => m.id === req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      userName: currentSessionUser?.name || "Anonymous",
      rating: Number(rating) || 8,
      comment: comment || "",
      date: new Date().toISOString().split("T")[0]
    };

    if (!movieReviews[movie.id]) {
      movieReviews[movie.id] = [];
    }
    movieReviews[movie.id].unshift(newReview);

    // Recalculate average rating
    const allReviews = movieReviews[movie.id];
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    movie.rating = Number(avg.toFixed(1));

    res.json({ success: true, review: newReview, newMovieRating: movie.rating });
  });

  // ==========================================
  // USER PERSONALIZATION ENDPOINTS (FAVORITES & HISTORY)
  // ==========================================

  app.get("/api/user/favorites", requireAuth, (req, res) => {
    const favMovies = movies.filter(m => favorites.includes(m.id));
    res.json(favMovies);
  });

  app.post("/api/user/favorites", requireAuth, (req, res) => {
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: "movieId is required" });

    if (!favorites.includes(movieId)) {
      favorites.push(movieId);
      // Increment likes safely
      const m = movies.find(mov => mov.id === movieId);
      if (m) m.likes += 1;
    }
    res.json({ success: true, favorites });
  });

  app.delete("/api/user/favorites/:movieId", requireAuth, (req, res) => {
    const { movieId } = req.params;
    favorites = favorites.filter(id => id !== movieId);
    // Decrement likes safely
    const m = movies.find(mov => mov.id === movieId);
    if (m && m.likes > 0) m.likes -= 1;
    res.json({ success: true, favorites });
  });

  // Fetch Continue Watching history
  app.get("/api/user/history", requireAuth, (req, res) => {
    const response = watchHistory.map(hist => {
      const movie = movies.find(m => m.id === hist.movieId);
      return {
        ...hist,
        movie
      };
    }).filter(item => item.movie !== undefined);
    res.json(response);
  });

  // Record playback progress
  app.post("/api/user/history", requireAuth, (req, res) => {
    const { movieId, progress, duration } = req.body;
    if (!movieId) return res.status(400).json({ error: "movieId is required" });

    const existingIdx = watchHistory.findIndex(h => h.movieId === movieId);
    const updateItem: WatchHistoryItem = {
      movieId,
      progress: Number(progress) || 0,
      duration: Number(duration) || 1,
      lastWatched: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      watchHistory[existingIdx] = updateItem;
    } else {
      watchHistory.unshift(updateItem);
    }

    res.json({ success: true, history: watchHistory });
  });

  // ==========================================
  // CMS GLOBAL SETTINGS & ANALYTICS
  // ==========================================

  app.get("/api/settings", (req, res) => {
    res.json(cmsSettings);
  });

  app.put("/api/settings", requireAdmin, (req, res) => {
    cmsSettings = {
      ...cmsSettings,
      ...req.body
    };
    res.json(cmsSettings);
  });

  app.get("/api/dashboard/stats", requireAdmin, (req, res) => {
    // Dynamically calculate metrics based on in-memory arrays
    const totalMovs = movies.length;
    const totalVws = movies.reduce((sum, m) => sum + m.views, 0);
    // Estimate total watch time: views * average 45% of duration
    const totalWt = Math.round(movies.reduce((sum, m) => sum + (m.views * (m.duration * 0.45)), 0) / 60);
    const totalUsrs = users.length;

    // Distribution by genre
    const genreMap: Record<string, number> = {};
    movies.forEach(m => {
      m.genres.forEach(g => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });
    const genreDistribution = Object.entries(genreMap).map(([name, count]) => ({ name, count }));

    // Top Movies by views
    const topMovies = [...movies]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(m => ({ id: m.id, title: m.title, views: m.views, rating: m.rating }));

    const stats: DashboardStats = {
      totalMovies: totalMovs,
      totalViews: totalVws,
      totalWatchTime: totalWt,
      totalUsers: totalUsrs,
      activeUsersToday: 42, // Mock live active count
      revenueThisMonth: 1249, // Mock SaaS income
      recentViews: [
        { date: "Mon", count: 1240 },
        { date: "Tue", count: 1450 },
        { date: "Wed", count: 1100 },
        { date: "Thu", count: 1680 },
        { date: "Fri", count: 2100 },
        { date: "Sat", count: 2840 },
        { date: "Sun", count: 2450 }
      ],
      genreDistribution,
      topMovies
    };

    res.json(stats);
  });

  // ==========================================
  // VITE DEV SERVER / PRODUCTION INGRESS
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
