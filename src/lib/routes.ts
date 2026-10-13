/**
 * Route synchronization utilities for MyStreamFlix
 * Maps URLs to client state (activeTab and selectedContentType) and vice versa.
 */

export type ContentType = "all" | "movie" | "series" | "livetv";

export interface RouteState {
  tab: string;
  contentType: ContentType;
}

/**
 * Parses current URL pathname to determine activeTab and selectedContentType.
 */
export function parseRoute(pathname?: string): RouteState {
  if (!pathname) return { tab: "home", contentType: "all" };

  // Normalize path (lowercase, strip trailing slashes)
  const clean = pathname.toLowerCase().split("?")[0].replace(/\/+$/, "") || "/";

  // Admin routes
  if (clean === "/admin" || clean.startsWith("/admin/") || clean === "/dashboard") {
    return { tab: "admin", contentType: "all" };
  }

  // Favorites / Watchlist routes
  if (clean === "/favorites" || clean === "/my-list" || clean === "/watchlist") {
    return { tab: "favorites", contentType: "all" };
  }

  // Movies catalog routes
  if (clean === "/movies" || clean === "/movie") {
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
 * Returns canonical URL for a given tab and contentType.
 */
export function getRouteUrl(tab: string, contentType: ContentType = "all"): string {
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
