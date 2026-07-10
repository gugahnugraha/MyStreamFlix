import { NextRequest, NextResponse } from "next/server";
import { getMovieById, updateMovie, deleteMovie, findDuplicateMovie } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // We increment views on GET request as in original server.ts
    const movie = await getMovieById(id, true);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Determine fallback trailer search link
    let trailerUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.title + " Official Trailer")}`;

    // If tmdbId is set, fetch official trailer from TMDB
    const apiKey = process.env.TMDB_API_KEY?.trim();
    if (movie.tmdbId && apiKey && apiKey !== "MY_TMDB_API_KEY") {
      try {
        const mediaType = movie.tmdbMediaType === "series" ? "tv" : (movie.tmdbMediaType || "movie");
        const tmdbUrl = `https://api.themoviedb.org/3/${mediaType}/${movie.tmdbId}/videos?api_key=${apiKey}&language=en-US`;
        const res = await fetch(tmdbUrl);
        if (res.ok) {
          const data = await res.json();
          const trailer = (data.results || []).find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
                          (data.results || []).find((v: any) => v.site === "YouTube");
          if (trailer?.key) {
            trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch official trailer from TMDB:", err);
      }
    }

    return NextResponse.json({
      ...movie,
      trailerUrl
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const duplicate = await findDuplicateMovie(body, id);
    if (duplicate) {
      return NextResponse.json({
        error: `"${duplicate.title}" is already in the catalog database.`,
        duplicateId: duplicate.id,
        duplicateTitle: duplicate.title
      }, { status: 409 });
    }

    const updated = await updateMovie(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { id } = await params;
    const success = await deleteMovie(id);
    if (!success) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
