import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function extractGoogleDriveFileId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = rawUrl.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    url = url.trim();

    // Check if it is a Google Drive URL
    const gdriveFileId = extractGoogleDriveFileId(url);
    if (gdriveFileId) {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

      // If service account is available, fetch raw content via Google Drive API
      if (serviceAccountEmail && privateKey) {
        try {
          const auth = new google.auth.JWT({
            email: serviceAccountEmail,
            key: privateKey,
            scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
          });
          const drive = google.drive({ version: "v3", auth });

          const fileRes = await drive.files.get(
            { fileId: gdriveFileId, alt: "media" },
            { responseType: "text" }
          );

          return new NextResponse(fileRes.data as string, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (apiErr) {
          console.warn("Direct Google Drive API fetch for subtitle failed, trying direct URL:", apiErr);
        }
      }

      // Fallback: use direct download URL
      url = `https://drive.google.com/uc?export=download&id=${gdriveFileId}`;
    }

    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch remote subtitle: ${response.statusText}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch subtitle" }, { status: 500 });
  }
}
