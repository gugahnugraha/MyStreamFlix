/**
 * Route synchronization utilities for MyStreamFlix
 * Maps URLs to client state (activeTab, selectedContentType, movieId, watchId, castId) and vice versa.
 */

export type ContentType = "all" | "movie" | "series" | "livetv";

export interface RouteState {
  tab: string;
  contentType: ContentType;
  castId?: string;
  movieId?: string;
  watchId?: string;
}

/**
 * Parses current URL pathname to determine activeTab, contentType, movieId, watchId, or castId.
 */
export function parseRoute(pathname?: string): RouteState {
  if (!pathname) return { tab: "home", contentType: "all" };

  // Normalize path (lowercase, strip trailing slashes)
  const clean = pathname.toLowerCase().split("?")[0].replace(/\/+$/, "") || "/";

  // Watch routes: /watch/12345
  const watchMatch = clean.match(/^\/watch\/([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return { tab: "home", contentType: "all", watchId: watchMatch[1] };
  }

  // Movie / Content detail routes: /movie/12345 or /item/12345
  const movieMatch = clean.match(/^\/(?:movie|title|film)\/([a-zA-Z0-9_-]+)/);
  if (movieMatch) {
    return { tab: "home", contentType: "all", movieId: movieMatch[1] };
  }

  // Cast / Person detail routes: /cast/12345 or /person/12345
  const castMatch = clean.match(/^\/(?:cast|person)\/([a-zA-Z0-9_-]+)/);
  if (castMatch) {
    return { tab: "cast", contentType: "all", castId: castMatch[1] };
  }

  // Admin routes
  if (clean === "/admin" || clean.startsWith("/admin/") || clean === "/dashboard") {
    return { tab: "admin", contentType: "all" };
  }

  // Favorites / Watchlist routes
  if (clean === "/favorites" || clean === "/my-list" || clean === "/watchlist") {
    return { tab: "favorites", contentType: "all" };
  }

  // Movies catalog routes
  if (clean === "/movies") {
    return { tab: "home", contentType: "movie" };
  }

  // TV Series catalog routes
  if (clean === "/series" || clean === "/tv-series" || clean === "/tv") {
    return { tab: "home", contentType: "series" };
  }

  // Live TV station routes
  if (clean === "/livetv" || clean === "/live-tv") {
    return { tab: "home", contentType: "livetv" };
  }

  // Default Home / Browse
  return { tab: "home", contentType: "all" };
}

/**
 * Returns canonical URL for a given state.
 */
export function getRouteUrl(
  tab: string,
  contentType: ContentType = "all",
  castId?: string,
  movieId?: string,
  watchId?: string
): string {
  if (watchId) return `/watch/${watchId}`;
  if (movieId) return `/movie/${movieId}`;
  if (tab === "cast" && castId) return `/cast/${castId}`;
  if (tab === "admin") return "/admin";
  if (tab === "favorites") return "/favorites";

  if (tab === "home") {
    if (contentType === "movie") return "/movies";
    if (contentType === "series") return "/series";
    if (contentType === "livetv") return "/livetv";
    return "/";
  }

  return "/";
}

export function getMovieUrl(id: string): string {
  return `/movie/${id}`;
}

export function getWatchUrl(id: string): string {
  return `/watch/${id}`;
}
