import { NextRequest, NextResponse } from "next/server";
import { addReview, getMovieById } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const movie = await getMovieById(id);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    const review = await addReview(id, sessionUser.name, rating, comment);
    
    // Refresh movie to get the updated rating
    const updatedMovie = await getMovieById(id);
    const newMovieRating = updatedMovie ? updatedMovie.rating : movie.rating;

    return NextResponse.json({ success: true, review, newMovieRating });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
