import { NextRequest, NextResponse } from "next/server";
import { getMovies } from "@/src/lib/data-service";
import { searchTmdbPerson } from "@/src/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
    if (!query) {
      return NextResponse.json([]);
    }

    const q = query.toLowerCase();
    const localMovies = await getMovies();

    // Local Title matches (playable movies and series in our catalog)
    const localTitleMatches = localMovies
      .filter(m => m.contentType !== "livetv" && !m.id.startsWith("tv-"))
      .filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(g))
      )
      .slice(0, 5)
      .map(m => ({
        id: `local-title-${m.id}`,
        movieId: m.id,
        source: "local",
        type: m.contentType === "series" ? "series" : "movie",
        title: m.title,
        subtitle: `${m.contentType === "series" ? "TV Series" : "Movie"} • ${m.releaseYear}`,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        query: m.title
      }));

    // TMDB Cast matches — Queried directly from TMDB API as requested, NOT from local DB
    let tmdbCastMatches: any[] = [];
    try {
      tmdbCastMatches = await searchTmdbPerson(query);
    } catch (tmdbErr) {
      console.warn("Failed fetching cast from TMDB in suggestions:", tmdbErr);
    }

    // Combine matches uniquely
    const unique = new Map<string, any>();
    [...localTitleMatches, ...tmdbCastMatches].forEach((item) => {
      const key = `${item.type}-${item.title}`.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });

    return NextResponse.json(Array.from(unique.values()).slice(0, 12));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
