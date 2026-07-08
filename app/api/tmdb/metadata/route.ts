import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbMetadata } from "@/src/lib/tmdb";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tmdbId = searchParams.get("id") || "";
    const mediaTypeParam = searchParams.get("mediaType") || searchParams.get("type") || "";
    const mediaType = mediaTypeParam === "series" ? "tv" : mediaTypeParam;

    if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
      return NextResponse.json({ error: "Valid TMDB id and mediaType are required." }, { status: 400 });
    }

    const metadata = await fetchTmdbMetadata(mediaType as "movie" | "tv", tmdbId);
    return NextResponse.json(metadata);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
