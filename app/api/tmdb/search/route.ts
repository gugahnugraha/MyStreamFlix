import { NextRequest, NextResponse } from "next/server";
import { searchTmdbMulti } from "@/src/lib/tmdb";
import { getMovies } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
    const contentType = searchParams.get("contentType") || "all";

    if (!query) {
      return NextResponse.json([]);
    }

    const results = await searchTmdbMulti(query);
    const localMovies = await getMovies();

    const filtered = results.filter((item: any) => {
      if (contentType === "movie") return item.type === "movie";
      if (contentType === "series") return item.type === "series";
      return item.type === "movie" || item.type === "series";
    }).map((item: any) => {
      const mediaType = item.type === "series" ? "tv" : "movie";
      const existing = localMovies.find(
        (movie) => movie.tmdbId === item.tmdbId && 
        (movie.tmdbMediaType || (movie.contentType === "series" ? "tv" : "movie")) === mediaType
      );
      
      return {
        ...item,
        alreadyImported: !!existing,
        existingMovieId: existing?.id
      };
    });

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
