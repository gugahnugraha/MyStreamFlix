import { NextResponse } from "next/server";
import { getUsers } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
