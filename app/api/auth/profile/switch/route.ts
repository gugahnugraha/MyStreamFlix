import { NextRequest, NextResponse } from "next/server";
import { switchUserProfile } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { profileId } = await request.json();
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const profileExists = sessionUser.profiles?.some(p => p.id === profileId);
    if (!profileExists) {
      return NextResponse.json({ error: "Profile not found for this user." }, { status: 404 });
    }

    const updatedUser = await switchUserProfile(sessionUser.id, profileId);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
