import { Movie, User } from "../types";

export const DEFAULT_BACKEND_URL = "https://mystreamflix.biz.id";

export async function fetchMovies(backendUrl: string = DEFAULT_BACKEND_URL): Promise<Movie[]> {
  try {
    const res = await fetch(`${backendUrl}/api/movies`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MyStreamFlix-Mobile/3.0",
      },
    });

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.movies || [];
    }
  } catch (err) {
    console.warn("API fetchMovies error:", err);
  }
  return [];
}

export async function fetchMovieById(id: string, backendUrl: string = DEFAULT_BACKEND_URL): Promise<Movie | null> {
  try {
    const res = await fetch(`${backendUrl}/api/movies/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("API fetchMovieById error:", err);
  }
  return null;
}

export async function loginUser(
  email: string,
  password?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!email || !password) {
    return { success: false, error: "Email dan kata sandi wajib diisi." };
  }

  try {
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Email atau kata sandi salah." };
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghubungi server database." };
  }
}

export async function registerUser(
  name: string,
  email: string,
  password?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!name || !email || !password) {
    return { success: false, error: "Semua kolom pendaftaran wajib diisi." };
  }

  try {
    const res = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Pendaftaran gagal." };
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal terhubung ke database." };
  }
}

export async function fetchDatabaseUsers(backendUrl: string = DEFAULT_BACKEND_URL): Promise<User[]> {
  try {
    const res = await fetch(`${backendUrl}/api/users`, {
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
      },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.users || [];
    }
  } catch (err) {
    console.warn("fetchDatabaseUsers error:", err);
  }
  return [
    {
      id: "usr-1",
      name: "Admin",
      email: "admin@streamcms.com",
      role: "admin",
      createdAt: new Date().toISOString(),
      isPremium: true,
    },
  ];
}

export async function createMovieOrChannel(
  movieData: Partial<Movie>,
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
        "x-user-role": "admin",
      },
      body: JSON.stringify(movieData),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, movie: data };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan konten." };
  }
  return { success: false, error: "Gagal menyimpan konten ke database." };
}

export async function deleteMovieById(
  id: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${backendUrl}/api/movies/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-pin": "1234",
        "x-admin-key": "mystreamflix_secret",
        "x-admin-email": "admin@streamcms.com",
        "x-user-role": "admin",
      },
    });
    if (res.ok) {
      return { success: true };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
  return { success: true };
}