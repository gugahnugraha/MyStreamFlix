import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const settings = await updateSettings(body);
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
