import { NextRequest, NextResponse } from "next/server";
import { translateToIndonesian } from "@/src/lib/translate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = (body.text || "").trim();

    if (!text) {
      return NextResponse.json({ translatedText: "" });
    }

    const translatedText = await translateToIndonesian(text);
    return NextResponse.json({
      success: true,
      originalText: text,
      translatedText
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Translation failed" }, { status: 500 });
  }
}
