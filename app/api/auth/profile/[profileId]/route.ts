import { NextRequest, NextResponse } from "next/server";
import { deleteUserProfile } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { profileId } = await params;
    const updatedUser = await deleteUserProfile(sessionUser.id, profileId);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
