import { NextRequest, NextResponse } from "next/server";
import { getFavorites, addFavorite } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const favorites = await getFavorites(sessionUser.id);
    return NextResponse.json(favorites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const { movieId } = body;
    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }

    const favorites = await addFavorite(sessionUser.id, movieId);
    return NextResponse.json({ success: true, favorites });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
