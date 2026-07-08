import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

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
    const { role } = body;

    if (role !== "admin" && role !== "user") {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const updated = await updateUserRole(id, role);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
