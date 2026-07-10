/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subtitle {
  id: string;
  language: string;
  label: string;
  fileUrl: string;
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
  videoUrl: string; // Plays mock HLS stream or static sample video
  duration: number; // in minutes
  releaseYear: number;
  rating: number; // e.g. 8.5
  ageRating: string; // PG-13, R, etc.
  quality: "4K" | "Ultra HD" | "Full HD" | "HD";
  genres: string[];
  cast: string[];
  directors: string[];
  subtitles: Subtitle[];
  country: string;
  language: string;
  views: number;
  likes: number;
  isFeatured: boolean;
  isBanner: boolean; // Homepage banner carousel
  createdAt: string;
  tmdbId?: number;
  tmdbMediaType?: "movie" | "tv";
  tier?: "free" | "vip" | "premium"; // content classification like Hotstar/Prime
  contentType?: "movie" | "series";
  seasons?: Season[];
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
  isPremium?: boolean; // subscription status flag
  profiles?: UserProfile[];
  activeProfileId?: string;
}

export interface WatchHistoryItem {
  movieId: string;
  progress: number; // in seconds
  duration: number; // in seconds
  lastWatched: string;
}

export interface DashboardStats {
  totalMovies: number;
  totalViews: number;
  totalWatchTime: number; // in hours
  totalUsers: number;
  activeUsersToday: number;
  revenueThisMonth: number;
  recentViews: { date: string; count: number }[];
  genreDistribution: { name: string; count: number }[];
  topMovies: { id: string; title: string; views: number; rating: number }[];
  profileSplit: { kids: number; adult: number };
  subscriptionSplit: { free: number; premium: number };
}

export interface CMSSettings {
  siteName: string;
  logoText: string;
  primaryColor: string;
  enableComments: boolean;
  enableRatings: boolean;
  maintenanceMode: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}
