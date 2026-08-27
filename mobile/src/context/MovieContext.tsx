import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Movie } from "../types";
import { DEFAULT_BACKEND_URL, fetchMovies } from "../api/client";

const CACHE_KEY = "mystreamflix_movies_cache";
const FAVORITES_KEY = "mystreamflix_favorites_ids";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface MovieContextType {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  favorites: string[];
  toggleFavorite: (movieId: string) => Promise<void>;
  isFavorite: (movieId: string) => boolean;
  refresh: () => Promise<void>;
}

const MovieContext = createContext<MovieContextType>({
  movies: [],
  loading: true,
  error: null,
  favorites: [],
  toggleFavorite: async () => {},
  isFavorite: () => false,
  refresh: async () => {},
});

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from AsyncStorage
  useEffect(() => {
    const loadFavs = async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (raw) {
          setFavorites(JSON.parse(raw));
        }
      } catch {}
    };
    loadFavs();
  }, []);

  const toggleFavorite = useCallback(async (movieId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (movieId: string) => {
      return favorites.includes(movieId);
    },
    [favorites]
  );

  const loadFromCache = useCallback(async (): Promise<{ data: Movie[]; fresh: boolean } | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const age = Date.now() - (parsed.timestamp || 0);
      return {
        data: Array.isArray(parsed.data) ? parsed.data : [],
        fresh: age < CACHE_TTL_MS,
      };
    } catch {
      return null;
    }
  }, []);

  const saveToCache = useCallback(async (data: Movie[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}
  }, []);

  const fetchAndStore = useCallback(async (): Promise<Movie[]> => {
    const data = await fetchMovies();
    if (data.length > 0) {
      setMovies(data);
      setError(null);
      await saveToCache(data);
      return data;
    }
    throw new Error("No data received");
  }, [saveToCache]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAndStore();
    } catch {
      const cached = await loadFromCache();
      if (cached && cached.data.length > 0) {
        setMovies(cached.data);
      } else {
        setError("Gagal memuat katalog. Periksa koneksi internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchAndStore, loadFromCache]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Fast path: load cache first
      const cached = await loadFromCache();
      if (cached && cached.data.length > 0) {
        setMovies(cached.data);
        setLoading(false);
        if (cached.fresh) return;
      }
      try {
        await fetchAndStore();
      } catch {
        if (!cached || cached.data.length === 0) {
          setError("Gagal memuat katalog. Periksa koneksi internet Anda.");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadFromCache, fetchAndStore]);

  return (
    <MovieContext.Provider value={{ movies, loading, error, favorites, toggleFavorite, isFavorite, refresh }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => useContext(MovieContext);