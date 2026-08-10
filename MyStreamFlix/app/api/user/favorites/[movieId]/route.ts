import { NextRequest, NextResponse } from "next/server";
import { removeFavorite } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { movieId } = await params;
    const favorites = await removeFavorite(sessionUser.id, movieId);
    return NextResponse.json({ success: true, favorites });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
