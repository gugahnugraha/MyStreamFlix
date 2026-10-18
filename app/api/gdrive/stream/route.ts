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

    // 1. Get file metadata (size, mimeType, name, shortcutDetails)
    let activeFileId = fileId;
    let metaRes = await drive.files.get({
      fileId: activeFileId,
      fields: "id, name, mimeType, size, shortcutDetails",
      supportsAllDrives: true,
    });

    // If it's a shortcut, follow the targetId
    if (metaRes.data.mimeType === "application/vnd.google-apps.shortcut" && metaRes.data.shortcutDetails?.targetId) {
      activeFileId = metaRes.data.shortcutDetails.targetId;
      metaRes = await drive.files.get({
        fileId: activeFileId,
        fields: "id, name, mimeType, size",
        supportsAllDrives: true,
      });
    }

    // If it's a folder, search for video files inside this folder automatically!
    if (metaRes.data.mimeType === "application/vnd.google-apps.folder") {
      const listRes = await drive.files.list({
        q: `'${activeFileId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, size)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 30,
      });

      const videoFiles = (listRes.data.files || []).filter(
        (f) => (f.mimeType && f.mimeType.startsWith("video/")) || (f.name && /\.(mp4|mkv|webm|avi|mov|m4v)$/i.test(f.name))
      );

      let targetFile = videoFiles[0] || (listRes.data.files || []).filter(f => f.mimeType !== "application/vnd.google-apps.folder").sort((a, b) => parseInt(b.size || "0", 10) - parseInt(a.size || "0", 10))[0];

      // If no video file in root of folder, check inside immediate subfolders (e.g. San Andreas/Season 1/)
      if (!targetFile) {
        const subFolders = (listRes.data.files || []).filter(f => f.mimeType === "application/vnd.google-apps.folder");
        for (const sub of subFolders) {
          const subList = await drive.files.list({
            q: `'${sub.id}' in parents and trashed = false`,
            fields: "files(id, name, mimeType, size)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            pageSize: 20,
          });
          const found = (subList.data.files || []).find(
            (f) => (f.mimeType && f.mimeType.startsWith("video/")) || (f.name && /\.(mp4|mkv|webm|avi|mov|m4v)$/i.test(f.name))
          );
          if (found) {
            targetFile = found;
            break;
          }
        }
      }

      if (!targetFile) {
        const itemNames = (listRes.data.files || []).map(f => f.name).join(", ");
        return NextResponse.json(
          {
            error: `Folder "${metaRes.data.name}" tidak berisi file video yang dapat diputar.` + (itemNames ? ` Isi folder: [${itemNames}].` : " (Folder kosong atau file di dalamnya belum dibagikan)."),
            folderName: metaRes.data.name,
            contents: (listRes.data.files || []).map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType }))
          },
          { status: 400 }
        );
      }

      activeFileId = targetFile.id!;
      metaRes = await drive.files.get({
        fileId: activeFileId,
        fields: "id, name, mimeType, size",
        supportsAllDrives: true,
      });
    }

    const fileSize = parseInt(metaRes.data.size || "0", 10);
    const mimeType = metaRes.data.mimeType || "video/mp4";
    const fileName = metaRes.data.name || activeFileId;

    if (metaRes.data.mimeType && metaRes.data.mimeType.startsWith("application/vnd.google-apps.")) {
      return NextResponse.json(
        {
          error: `Item "${fileName}" adalah tipe "${metaRes.data.mimeType}" (bukan file video). Pastikan Anda menyalin link file video (.mp4/.mkv), bukan dokumen atau folder kosong.`,
          name: fileName,
          mimeType: metaRes.data.mimeType,
        },
        { status: 400 }
      );
    }

    // 2. Handle HTTP Range Requests for video player seeking
    const rangeHeader = request.headers.get("range");

    if (rangeHeader && fileSize > 0) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const streamRes = await drive.files.get(
        {
          fileId: activeFileId,
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
        fileId: activeFileId,
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
