import { NextRequest, NextResponse } from "next/server";
import { deleteUser } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

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
    if (sessionUser.id === id) {
      return NextResponse.json({ error: "Cannot delete your own active session account." }, { status: 400 });
    }

    const success = await deleteUser(id);
    if (!success) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
