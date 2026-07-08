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

const defaultMovies: Movie[] = [
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
  "mov-1": [
    { id: "rev-1", userName: "Moviebuff99", rating: 9, comment: "An outstanding and charming animated masterpiece. Beautiful lighting and brilliant character work!", date: "2026-06-15" },
    { id: "rev-2", userName: "CinematicWhiz", rating: 8, comment: "Extremely funny and very well orchestrated. Perfect demo content for 4K setups.", date: "2026-06-20" }
  ],
  "mov-2": [
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

export const store = globalForInMemory.inMemoryStore || (() => {
  const newStore: InMemoryStore = {
    movies: [...defaultMovies],
    users: [...defaultUsers],
    favorites: {
      "usr-1": ["mov-1", "mov-3"],
      "usr-2": []
    },
    watchHistory: {
      "usr-1": [
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
