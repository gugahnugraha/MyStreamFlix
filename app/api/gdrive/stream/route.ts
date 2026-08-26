import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

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
    const rawIdOrUrl = searchParams.get("id") || searchParams.get("url");

    if (!rawIdOrUrl) {
      return NextResponse.json({ error: "Missing Google Drive file ID or URL parameter" }, { status: 400 });
    }

    const fileId = extractGoogleDriveFileId(rawIdOrUrl) || rawIdOrUrl.trim();

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: "Google Drive service account credentials are not configured in .env." },
        { status: 500 }
      );
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 1. Get file metadata (size, mimeType, name)
    const metaRes = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size",
      supportsAllDrives: true,
    });

    const fileSize = parseInt(metaRes.data.size || "0", 10);
    const mimeType = metaRes.data.mimeType || "video/mp4";

    // 2. Handle HTTP Range Requests for video player seeking
    const rangeHeader = request.headers.get("range");

    if (rangeHeader && fileSize > 0) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const streamRes = await drive.files.get(
        {
          fileId,
          alt: "media",
          supportsAllDrives: true,
        },
        {
          responseType: "stream",
          headers: {
            Range: `bytes=${start}-${end}`,
          },
        }
      );

      const nodeStream = streamRes.data as unknown as Readable;
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": mimeType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // 3. Full file stream
    const streamRes = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      {
        responseType: "stream",
      }
    );

    const nodeStream = streamRes.data as unknown as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    const responseHeaders: Record<string, string> = {
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    };

    if (fileSize > 0) {
      responseHeaders["Content-Length"] = String(fileSize);
    }

    return new NextResponse(webStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("GDrive video streaming error:", error);
    return NextResponse.json({ error: error.message || "Failed to stream video from Google Drive" }, { status: 500 });
  }
}
