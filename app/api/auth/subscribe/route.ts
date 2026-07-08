import { NextResponse } from "next/server";
import { subscribeUser } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function POST() {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const updated = await subscribeUser(sessionUser.id);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
