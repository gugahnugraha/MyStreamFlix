import { NextRequest, NextResponse } from "next/server";
import { getMovies, createMovie, findDuplicateMovie } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy");
    const contentType = searchParams.get("contentType");

    const movies = await getMovies({ genre, search, sortBy, contentType });
    return NextResponse.json(movies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const movieData = await request.json();
    if (!movieData.title || !movieData.videoUrl) {
      return NextResponse.json({ error: "Title and Video URL are required." }, { status: 400 });
    }

    const duplicate = await findDuplicateMovie(movieData);
    if (duplicate) {
      return NextResponse.json({
        error: `"${duplicate.title}" is already in the catalog database.`,
        duplicateId: duplicate.id,
        duplicateTitle: duplicate.title
      }, { status: 409 });
    }

    const createdMovie = await createMovie(movieData);
    return NextResponse.json(createdMovie, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
