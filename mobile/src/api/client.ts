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
    const res = await fetch(`${backendUrl}/api/users`, {
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
      },
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.users || [];
  } catch (error) {
    return [];
  }
}

// 📺 Live TV & Channel Creation API
export async function createLiveTvChannel(
  channelData: Partial<Movie>,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; movie?: Movie; error?: string }> {
  try {
    const res = await fetch(`${backendUrl}/api/movies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
      },
      body: JSON.stringify({
        ...channelData,
        contentType: "livetv",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Gagal membuat saluran TV." };
    }
    return { success: true, movie: data };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghubungi server database." };
  }
}

// 🗑️ Delete Movie or Channel from Database
export async function deleteMovieById(
  id: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${backendUrl}/api/movies/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Gagal menghapus item dari database." };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghubungi server database." };
  }
}

// 📡 M3U Playlist Scanner & Importer
export async function scanM3uPlaylist(
  sourceUrl: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; channels?: any[]; totalFound?: number; error?: string }> {
  try {
    const res = await fetch(`${backendUrl}/api/iptv-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
      },
      body: JSON.stringify({ sourceUrl, limit: 100 }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Gagal memindai playlist M3U." };
    }
    return {
      success: true,
      channels: data.channels || [],
      totalFound: data.totalFound || (data.channels ? data.channels.length : 0),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memindai playlist M3U." };
  }
}

export async function importM3uChannels(
  channels: any[],
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; importedCount?: number; error?: string }> {
  try {
    const formattedChannels = channels.map((ch, i) => ({
      title: ch.name || "Live TV Channel",
      videoUrl: ch.streamUrl,
      posterUrl: ch.logo || "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=80",
      backdropUrl: ch.logo || "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=80",
      contentType: "livetv",
      quality: "1080p FHD",
      genres: [ch.group || "Live TV"],
      description: `Live IPTV broadcast stream (${ch.country || "GLOBAL"})`,
      year: 2025,
      rating: 4.8,
    }));

    const res = await fetch(`${backendUrl}/api/movies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
      },
      body: JSON.stringify(formattedChannels),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Gagal mengimpor saluran." };
    }
    return { success: true, importedCount: data.importedCount || formattedChannels.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengimpor saluran." };
  }
}
