export interface Subtitle {
  id: string;
  language: string;
  label: string;
  url: string;
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
  year: number;
  duration: number;
  rating: string;
  quality: string;
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
