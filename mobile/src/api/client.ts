import { Movie, User } from "../types";

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

// 🔐 Real Database Authentication Client (Connected to Next.js Database API)
export async function loginUser(
  email: string,
  password?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Invalid credentials." };
    }
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error("API Login Error:", error);
    return { success: false, error: error.message || "Failed to connect to database." };
  }
}

export async function registerUser(
  name: string,
  email: string,
  password?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Registration failed." };
    }
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error("API Register Error:", error);
    return { success: false, error: error.message || "Failed to connect to database." };
  }
}

export async function fetchDatabaseUsers(
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<User[]> {
  try {
    const res = await fetch(`${backendUrl}/api/users`);
    if (!res.ok) throw new Error("Failed to fetch database users");
    const data = await res.json();
    return Array.isArray(data) ? data : data.users || [];
  } catch (error) {
    console.error("API Error fetching database users:", error);
    return [];
  }
}
