import { Movie, User, CMSSettings, WatchHistoryItem, Review, Subtitle } from "@/src/types";

interface InMemoryStore {
  movies: Movie[];
  users: User[];
  favorites: Record<string, string[]>; // userId -> movieIds[]
  watchHistory: Record<string, WatchHistoryItem[]>; // userId -> historyItems[]
  cmsSettings: CMSSettings;
  movieReviews: Record<string, Review[]>;
  passwords: Record<string, string>; // userId -> passwordHash
}

const sampleSubtitles: Subtitle[] = [
  { id: "sub-1", language: "en", label: "English", fileUrl: "" },
  { id: "sub-2", language: "es", label: "Español", fileUrl: "" },
  { id: "sub-3", language: "fr", label: "Français", fileUrl: "" },
  { id: "sub-4", language: "id", label: "Bahasa Indonesia", fileUrl: "" }
];
import dummyMovies from "./dummy-movies.json";

const defaultMovies: Movie[] = dummyMovies as Movie[];

const defaultUsers: User[] = [
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

const defaultSettings: CMSSettings = {
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

const defaultReviews: Record<string, Review[]> = {
  "mov-1339713": [
    { id: "rev-1", userName: "Moviebuff99", rating: 9, comment: "An outstanding and charming animated masterpiece. Beautiful lighting and brilliant character work!", date: "2026-06-15" },
    { id: "rev-2", userName: "CinematicWhiz", rating: 8, comment: "Extremely funny and very well orchestrated. Perfect demo content for 4K setups.", date: "2026-06-20" }
  ],
  "mov-1084244": [
    { id: "rev-3", userName: "FantasyLover", rating: 10, comment: "Deeply emotional story and spectacular art direction. The dragon flight scenes are magical.", date: "2026-06-25" }
  ]
};

// Simple sha256 hash representation for in-memory passwords
// (using plain text lookup is fine, but hashing matches server.ts design)
const hashPassword = (password: string) => {
  // Simulating a simple hash map. Admin has "admin", demo has "demo"
  if (password === "admin") return "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  if (password === "demo") return "02726d40f2a7a8d980d0130c1448b1422b9aa5d7904094a97491cf0ebcd5495b";
  
  // Basic numeric hashing fallback
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};

const defaultPasswords: Record<string, string> = {
  "usr-1": hashPassword("admin"),
  "usr-2": hashPassword("demo")
};

const globalForInMemory = global as unknown as { inMemoryStore: InMemoryStore | undefined };
globalForInMemory.inMemoryStore = undefined; // Reset old cached in-memory store so it loads our new 100-item TMDB dataset

export const store = globalForInMemory.inMemoryStore || (() => {
  const newStore: InMemoryStore = {
    movies: [...defaultMovies],
    users: [...defaultUsers],
    favorites: {
      "usr-1": ["mov-1339713", "mov-1275779"],
      "usr-2": []
    },
    watchHistory: {
      "usr-1": [
        {
          movieId: "mov-1339713",
          progress: 320,
          duration: 596,
          lastWatched: new Date().toISOString()
        },
        {
          movieId: "mov-1084244",
          progress: 45,
          duration: 893,
          lastWatched: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      "usr-2": []
    },
    cmsSettings: { ...defaultSettings },
    movieReviews: { ...defaultReviews },
    passwords: { ...defaultPasswords }
  };
  
  if (process.env.NODE_ENV !== "production") {
    globalForInMemory.inMemoryStore = newStore;
  }
  return newStore;
})();

export const helperHashPassword = hashPassword;
