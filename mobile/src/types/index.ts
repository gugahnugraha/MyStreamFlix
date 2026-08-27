/**
 * MyStreamFlix Mobile Type Definitions (Aligned 1:1 with Web types)
 */

export interface Subtitle {
  id: string;
  language: string;
  label: string;
  fileUrl?: string;
  url?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  duration: number; // in minutes
  videoUrl: string;
  description?: string;
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
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  duration?: number;
  releaseYear: number;
  year?: number;
  rating: number | string;
  ageRating?: string;
  quality?: string;
  genres: string[];
  cast?: string[];
  directors?: string[];
  subtitles?: Subtitle[];
  country?: string;
  language?: string;
  views?: number;
  likes?: number;
  isFeatured?: boolean;
  isBanner?: boolean;
  createdAt?: string;
  tmdbId?: number;
  tmdbMediaType?: string;
  tier?: "free" | "vip";
  contentType?: "movie" | "series" | "livetv";
  seasons?: Season[];
  reviews?: Review[];
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
  profileImage?: string;
  createdAt: string;
  isPremium?: boolean;
  profiles?: UserProfile[];
  activeProfileId?: string;
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  movieId: string;
  progress: number;
  duration: number;
  updatedAt: string;
  movie?: Movie;
}

export interface CMSSettings {
  siteName: string;
  logoText: string;
  logoUrl?: string;
  primaryColor: string;
  enableComments: boolean;
  enableRatings: boolean;
  maintenanceMode: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}