import { NextRequest, NextResponse } from "next/server";
import { createUserProfile } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";
import { UserProfile } from "@/src/types";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { name, avatar, isKids } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Profile name is required." }, { status: 400 });
    }

    const newProfile: UserProfile = {
      id: `prof-${Date.now()}`,
      name,
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      isKids: !!isKids
    };

    const updatedUser = await createUserProfile(sessionUser.id, newProfile);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
