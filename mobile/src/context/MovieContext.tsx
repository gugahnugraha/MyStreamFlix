import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Movie } from "../types";
import { DEFAULT_BACKEND_URL } from "../api/client";

const CACHE_KEY = "mystreamflix_movies_cache";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface MovieContextType {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  removeMovieLocally: (id: string) => void;
}

const MovieContext = createContext<MovieContextType>({
  movies: [],
  loading: true,
  error: null,
  lastUpdated: null,
  refresh: async () => {},
  removeMovieLocally: () => {},
});

async function fetchWithRetry(url: string, retries = 3, timeoutMs = 10000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "MyStreamFlix-Mobile/2.0",
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Max retries exceeded");
}

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const deletedIdsRef = useRef<Set<string>>(new Set());

  const loadFromCache = useCallback(async (): Promise<{ data: Movie[]; fresh: boolean } | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const age = Date.now() - (parsed.timestamp || 0);
      return { data: Array.isArray(parsed.data) ? parsed.data : [], fresh: age < CACHE_TTL_MS };
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
    const res = await fetchWithRetry(`${DEFAULT_BACKEND_URL}/api/movies`, 3, 10000);
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
    const raw = await res.json();
    const data: Movie[] = Array.isArray(raw) ? raw : raw.movies || [];
    const filtered = data.filter((m) => !deletedIdsRef.current.has(m.id));
    setMovies(filtered);
    setError(null);
    setLastUpdated(new Date());
    await saveToCache(filtered);
    return filtered;
  }, [saveToCache]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAndStore();
    } catch {
      const cached = await loadFromCache();
      if (cached && cached.data.length > 0) {
        setMovies(cached.data.filter((m) => !deletedIdsRef.current.has(m.id)));
        setError("Data dari cache offline (koneksi bermasalah)");
      } else {
        setError("Gagal memuat data. Cek koneksi internet lalu tarik ke bawah untuk refresh.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchAndStore, loadFromCache]);

  const removeMovieLocally = useCallback((id: string) => {
    deletedIdsRef.current.add(id);
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const cached = await loadFromCache();
      if (cached && cached.data.length > 0) {
        setMovies(cached.data.filter((m) => !deletedIdsRef.current.has(m.id)));
        setLoading(false);
        if (cached.fresh) return;
      }
      try {
        await fetchAndStore();
      } catch {
        if (!cached || cached.data.length === 0) {
          setError("Tidak dapat memuat data. Periksa koneksi internet Anda.");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadFromCache, fetchAndStore]);

  return (
    <MovieContext.Provider value={{ movies, loading, error, lastUpdated, refresh, removeMovieLocally }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => useContext(MovieContext);