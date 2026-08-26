import { Movie } from "../types";

export const DEFAULT_BACKEND_URL = "https://mystreamflix.biz.id";

export async function fetchMovies(backendUrl: string = DEFAULT_BACKEND_URL): Promise<Movie[]> {
  try {
    const res = await fetch(`${backendUrl}/api/movies`);
    if (!res.ok) throw new Error("Failed to fetch movies");
    const data = await res.json();
    return Array.isArray(data) ? data : data.movies || [];
  } catch (error) {
    console.error("API Error fetching movies:", error);
    return [];
  }
}

export async function fetchMovieById(id: string, backendUrl: string = DEFAULT_BACKEND_URL): Promise<Movie | null> {
  try {
    const res = await fetch(`${backendUrl}/api/movies/${id}`);
    if (!res.ok) throw new Error("Failed to fetch movie details");
    return await res.json();
  } catch (error) {
    console.error("API Error fetching movie by ID:", error);
    return null;
  }
}
