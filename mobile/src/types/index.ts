export interface Subtitle {
  id: string;
  language: string;
  label: string;
  url?: string;
  fileUrl?: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  backdropUrl: string;
  releaseYear?: number;
  year?: number;
  duration?: number;
  rating?: string | number;
  quality?: string;
  genres: string[];
  cast: string[];
  directors: string[];
  contentType: "movie" | "series" | "livetv";
  subtitles: Subtitle[];
  seasons?: Season[];
  likes?: number;
  views?: number;
  featured?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  isPremium: boolean;
  profiles?: UserProfile[];
  activeProfileId?: string;
  watchlist?: string[];
  history?: Array<{
    movieId: string;
    progress: number;
    updatedAt: string;
  }>;
}
