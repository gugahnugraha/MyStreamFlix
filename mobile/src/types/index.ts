export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration?: string;
  thumbnailUrl?: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  videoUrl: string;
  contentType: 'movie' | 'series';
  genre: string;
  rating?: number;
  releaseYear?: number;
  duration?: string;
  seasons?: Season[];
}

export interface LiveChannel {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
  streamUrl: string;
  isOnline: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  Detail: { movie: Movie };
  Player: { 
    title: string;
    videoUrl: string;
    posterUrl?: string;
    isLive?: boolean;
  };
  LiveTV: undefined;
};
