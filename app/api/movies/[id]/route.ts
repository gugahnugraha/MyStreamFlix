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
    return NextResponse.json(movie);
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
