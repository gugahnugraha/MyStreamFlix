import { NextRequest, NextResponse } from "next/server";
import { getWatchHistory, saveWatchHistory } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const history = await getWatchHistory(sessionUser.id);
    return NextResponse.json(history);
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
    const { movieId, progress, duration } = body;
    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }

    await saveWatchHistory(sessionUser.id, movieId, progress, duration);
    const history = await getWatchHistory(sessionUser.id);
    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
