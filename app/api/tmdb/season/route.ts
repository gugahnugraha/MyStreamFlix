import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbSeasonDetails } from "@/src/lib/tmdb";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tmdbId = searchParams.get("id") || "";
    const seasonNumberStr = searchParams.get("season") || searchParams.get("seasonNumber") || "1";
    const seasonNumber = parseInt(seasonNumberStr, 10);

    if (!tmdbId || isNaN(seasonNumber)) {
      return NextResponse.json({ error: "Valid TMDB ID and season number are required." }, { status: 400 });
    }

    const seasonDetails = await fetchTmdbSeasonDetails(tmdbId, seasonNumber);
    if (!seasonDetails) {
       return NextResponse.json({ error: `Season ${seasonNumber} not found on TMDB.` }, { status: 404 });
    }

    return NextResponse.json(seasonDetails);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch season details from TMDB." }, { status: 500 });
  }
}
