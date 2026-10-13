import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbMovieCredits, searchTmdbId } from "@/src/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let tmdbId = searchParams.get("id");
    const mediaTypeParam = searchParams.get("mediaType") || searchParams.get("type") || "movie";
    const mediaType = mediaTypeParam === "series" ? "tv" : (mediaTypeParam as "movie" | "tv");
    const title = searchParams.get("title");
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    if (!tmdbId && title) {
      const foundId = await searchTmdbId(title, mediaType, year);
      if (foundId) {
        tmdbId = String(foundId);
      }
    }

    if (!tmdbId) {
      return NextResponse.json({ cast: [] });
    }

    const cast = await fetchTmdbMovieCredits(mediaType, tmdbId);
    return NextResponse.json({ tmdbId: Number(tmdbId), cast });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve credits" }, { status: 500 });
  }
}
