/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Movie, User, WatchHistoryItem, CMSSettings, DashboardStats, Subtitle, Review } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
  app.post("/api/movies", requireAdmin, (req, res) => {
    const movieData: Partial<Movie> = req.body;
    if (!movieData.title || !movieData.videoUrl) {
      return res.status(400).json({ error: "Title and Video URL are required." });
    }

    const newMovie: Movie = {
      id: `mov-${movies.length + 1}`,
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
    res.status(201).json(newMovie);
  });

  // Admin CRUD: Update
  app.put("/api/movies/:id", requireAdmin, (req, res) => {
    const mIdx = movies.findIndex(m => m.id === req.params.id);
    if (mIdx === -1) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const original = movies[mIdx];
    const updateData = req.body;

    movies[mIdx] = {
      ...original,
      ...updateData,
      // Ensure specific types are maintained
      id: original.id,
      duration: updateData.duration !== undefined ? Number(updateData.duration) : original.duration,
      releaseYear: updateData.releaseYear !== undefined ? Number(updateData.releaseYear) : original.releaseYear,
      rating: updateData.rating !== undefined ? Number(updateData.rating) : original.rating,
      contentType: updateData.contentType || original.contentType,
      seasons: updateData.seasons || original.seasons,
    };

    res.json(movies[mIdx]);
  });

  // Admin CRUD: Delete
  app.delete("/api/movies/:id", requireAdmin, (req, res) => {
    const mIdx = movies.findIndex(m => m.id === req.params.id);
    if (mIdx === -1) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const deleted = movies.splice(mIdx, 1)[0];
    res.json({ success: true, deletedId: deleted.id });
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
