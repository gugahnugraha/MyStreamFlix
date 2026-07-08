import { NextRequest, NextResponse } from "next/server";
import { getMovies } from "@/src/lib/data-service";
import { searchTmdbMulti } from "@/src/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
    if (!query) {
      return NextResponse.json([]);
    }

    const q = query.toLowerCase();
    const localMovies = await getMovies();

    // Local Title matches
    const localTitleMatches = localMovies
      .filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q)) ||
        m.directors.some(d => d.toLowerCase().includes(q))
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

    // Local Cast matches
    const castNames = new Map<string, string[]>();
    localMovies.forEach((movie) => {
      movie.cast
        .filter(name => name.toLowerCase().includes(q))
        .forEach((name) => {
          const titles = castNames.get(name) || [];
          castNames.set(name, [...titles, movie.title].slice(0, 2));
        });
    });

    const localCastMatches = Array.from(castNames.entries()).slice(0, 4).map(([name, titles]) => ({
      id: `local-cast-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      source: "local",
      type: "cast",
      title: name,
      subtitle: `Cast • ${titles.join(", ")}`,
      posterUrl: "",
      query: name
    }));

    // TMDB matches
    let tmdbMatches: any[] = [];
    try {
      tmdbMatches = await searchTmdbMulti(query);
    } catch (error) {
      console.warn("TMDB suggestion lookup failed:", error);
    }

    // Combine matches uniquely
    const unique = new Map<string, any>();
    [...localTitleMatches, ...localCastMatches, ...tmdbMatches].forEach((item) => {
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
