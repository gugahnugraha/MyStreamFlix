import { NextResponse } from "next/server";
import { updateUserRole } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Role toggle is disabled in production." }, { status: 403 });
    }

    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const currentRole: "admin" | "user" = sessionUser.role;
    const nextRole: "admin" | "user" = currentRole === "admin" ? "user" : "admin";
    const updated = await updateUserRole(sessionUser.id, nextRole);

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
