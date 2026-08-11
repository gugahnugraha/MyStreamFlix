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

const defaultLiveTvChannels: Movie[] = [
  {
    id: "tv-tvri-nasional",
    title: "TVRI Nasional",
    description: "Televisi Republik Indonesia - Siaran TV nasional resmi 24 jam menyajikan berita, budaya, pendidikan, dan dokumenter Indonesia.",
    posterUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/TVRILogo2019.svg/960px-TVRILogo2019.svg.png",
    backdropUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.6,
    ageRating: "SU",
    quality: "Full HD",
    genres: ["News", "Drama"],
    cast: ["Presenter TVRI", "Direksi LPP TVRI"],
    directors: ["LPP TVRI"],
    subtitles: [],
    country: "Indonesia",
    language: "id",
    views: 345000,
    likes: 42000,
    isFeatured: true,
    isBanner: true,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-trans7",
    title: "Trans7 Live",
    description: "Siaran langsung Trans7 menyajikan program hiburan terpopuler, On The Spot, Jejak Petualang, MotoGP, dan acara komedi.",
    posterUrl: "https://i.imgur.com/fAbGImS.png",
    backdropUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://video.detik.com/trans7/smil:trans7.smil/index.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.4,
    ageRating: "R13",
    quality: "Full HD",
    genres: ["Comedy", "Action"],
    cast: ["Host Trans7", "Tim Produksi Trans Corp"],
    directors: ["Trans Media"],
    subtitles: [],
    country: "Indonesia",
    language: "id",
    views: 289000,
    likes: 31000,
    isFeatured: true,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-transtv",
    title: "Trans TV Live",
    description: "Siaran langsung Trans TV menyajikan Bioskop Trans TV, Transmania, talkshow hits, dan program hiburan keluarga terbaik.",
    posterUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/62/Trans_TV_2013.svg/960px-Trans_TV_2013.svg.png",
    backdropUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://video.detik.com/transtv/smil:transtv.smil/index.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.3,
    ageRating: "R13",
    quality: "Full HD",
    genres: ["Action", "Comedy"],
    cast: ["Artis Trans TV", "Presenter Trans TV"],
    directors: ["Trans Media"],
    subtitles: [],
    country: "Indonesia",
    language: "id",
    views: 265000,
    likes: 29000,
    isFeatured: true,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-metrotv",
    title: "Metro TV Live",
    description: "Stasiun berita 24 jam terdepan di Indonesia menyajikan Primetime News, Kick Andy, Mata Najwa archives, & update terkini.",
    posterUrl: "https://i.imgur.com/QnU70NI.png",
    backdropUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.2,
    ageRating: "SU",
    quality: "Full HD",
    genres: ["News"],
    cast: ["Jurnalis Metro TV", "Anchor Newsroom"],
    directors: ["Media Group"],
    subtitles: [],
    country: "Indonesia",
    language: "id",
    views: 198000,
    likes: 24000,
    isFeatured: false,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-cnbc-id",
    title: "CNBC Indonesia Live",
    description: "Saluran TV berita ekonomi, pasar saham, investasi, perbankan, dan analisa bisnis nomor satu di Indonesia.",
    posterUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/CNBC_Indonesia_2025.svg/960px-CNBC_Indonesia_2025.svg.png",
    backdropUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/playlist.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.1,
    ageRating: "SU",
    quality: "Full HD",
    genres: ["News"],
    cast: ["Analis Ekonomi CNBC", "News Anchor CNBC"],
    directors: ["Trans Media & CNBC Universal"],
    subtitles: [],
    country: "Indonesia",
    language: "id",
    views: 175000,
    likes: 19500,
    isFeatured: false,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-1",
    title: "NASA TV Live",
    description: "Official 24/7 live stream broadcasting spacewalks, rocket launches, views of Earth from the ISS, and NASA mission coverage.",
    posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-v1/master.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.5,
    ageRating: "G",
    quality: "4K",
    genres: ["News", "Sci-Fi"],
    cast: ["NASA Astronauts", "Mission Control"],
    directors: ["NASA TV"],
    subtitles: [],
    country: "United States",
    language: "en",
    views: 125400,
    likes: 18900,
    isFeatured: true,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-2",
    title: "France 24 English Live",
    description: "International 24-hour news channel reporting on world events, diplomacy, culture, and current affairs in real time.",
    posterUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.0,
    ageRating: "G",
    quality: "Full HD",
    genres: ["News"],
    cast: ["France 24 Newsroom"],
    directors: ["France Médias Monde"],
    subtitles: [],
    country: "France",
    language: "en",
    views: 87900,
    likes: 9200,
    isFeatured: false,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-3",
    title: "Red Bull TV Live",
    description: "High-octane live action sports, Formula 1 highlights, mountain biking, esports, and music festival live streams.",
    posterUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://rbmn-live.akamaized.net/hls/live/591070/FL_FULL_HD_1080p@1/master.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 9.4,
    ageRating: "PG-13",
    quality: "4K",
    genres: ["Action", "Sports"],
    cast: ["Pro Athletes", "Red Bull Crew"],
    directors: ["Red Bull Media"],
    subtitles: [],
    country: "Austria",
    language: "en",
    views: 145000,
    likes: 21000,
    isFeatured: true,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "vip",
    contentType: "livetv"
  },
  {
    id: "tv-4",
    title: "DW News 24/7",
    description: "Global news channel providing unbiased reporting, in-depth analysis, documentaries, and global perspective 24 hours a day.",
    posterUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 8.9,
    ageRating: "G",
    quality: "Full HD",
    genres: ["News"],
    cast: ["Deutsche Welle Anchors"],
    directors: ["DW Network"],
    subtitles: [],
    country: "Germany",
    language: "en",
    views: 65400,
    likes: 7100,
    isFeatured: false,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-5",
    title: "EuroNews English",
    description: "European & international news network broadcasting real-time updates, world affairs, technology, and economic news.",
    posterUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://euronews-euronews-world-1-au.samsung.wurl.tv/playlist.m3u8",
    duration: 0,
    releaseYear: 2026,
    rating: 8.8,
    ageRating: "G",
    quality: "Full HD",
    genres: ["News"],
    cast: ["Euronews Team"],
    directors: ["Euronews SA"],
    subtitles: [],
    country: "France",
    language: "en",
    views: 54300,
    likes: 6200,
    isFeatured: false,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "free",
    contentType: "livetv"
  },
  {
    id: "tv-6",
    title: "Action Central TV",
    description: "24/7 non-stop adrenaline action movies, blockbuster trailers, and martial arts film showcases.",
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    duration: 0,
    releaseYear: 2026,
    rating: 9.1,
    ageRating: "R",
    quality: "4K",
    genres: ["Action", "Drama"],
    cast: ["Action All-Stars"],
    directors: ["FlixSphere Live"],
    subtitles: [],
    country: "United States",
    language: "en",
    views: 112000,
    likes: 15400,
    isFeatured: true,
    isBanner: false,
    createdAt: new Date().toISOString(),
    tier: "vip",
    contentType: "livetv"
  }
];

const defaultMovies: Movie[] = [...defaultLiveTvChannels, ...(dummyMovies as Movie[])];

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
      { id: "prof-1", name: "Admin", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", isKids: false },
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
      { id: "prof-3", name: "Demo", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", isKids: false },
      { id: "prof-4", name: "Kids Mode", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true }
    ],
    activeProfileId: "prof-3"
  },
  {
    id: "usr-3",
    name: "Premium Viewer",
    email: "premium@viewer.com",
    role: "user",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    isPremium: true,
    profiles: [
      { id: "prof-5", name: "Premium", avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&auto=format&fit=crop&q=80", isKids: false }
    ],
    activeProfileId: "prof-5"
  }
];

const defaultSettings: CMSSettings = {
  siteName: "FlixSphere",
  logoText: "FLIXSPHERE",
  logoUrl: "",
  primaryColor: "#00ADB5", // Fixed Cyan Accent
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
  "usr-2": hashPassword("demo"),
  "usr-3": hashPassword("premium")
};

const globalForInMemory = global as unknown as { inMemoryStore: InMemoryStore | undefined };
// globalForInMemory.inMemoryStore = undefined; // Reset old cached in-memory store so it loads our new 100-item TMDB dataset

export const store = globalForInMemory.inMemoryStore || (() => {
  const newStore: InMemoryStore = {
    movies: [...defaultMovies],
    users: [...defaultUsers],
    favorites: {
      "usr-1": ["mov-1339713", "mov-1275779"],
      "usr-2": [],
      "usr-3": ["mov-1084244"]
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
      "usr-2": [],
      "usr-3": []
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
