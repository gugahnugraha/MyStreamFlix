import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
