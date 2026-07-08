import { NextResponse } from "next/server";
import { updateUserRole } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function POST() {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const nextRole = sessionUser.role === "admin" ? "user" : "admin";
    const updated = await updateUserRole(sessionUser.id, nextRole);

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
