import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbPersonDetails } from "@/src/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Person ID is required" }, { status: 400 });
    }

    const person = await fetchTmdbPersonDetails(id);
    if (!person) {
      return NextResponse.json({ error: "Person details not found on TMDB" }, { status: 404 });
    }

    return NextResponse.json(person);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve cast details" },
      { status: 500 }
    );
  }
}
