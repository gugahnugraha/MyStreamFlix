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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function HEAD(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawIdOrUrl = searchParams.get("id") || searchParams.get("url");

    if (!rawIdOrUrl) {
      return new NextResponse(null, { status: 400 });
    }

    const fileId = extractGoogleDriveFileId(rawIdOrUrl) || rawIdOrUrl.trim();
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!serviceAccountEmail || !privateKey) {
      return new NextResponse(null, { status: 500 });
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    let activeFileId = fileId;
    let metaRes = await drive.files.get({
      fileId: activeFileId,
      fields: "id, name, mimeType, size, shortcutDetails",
      supportsAllDrives: true,
    });

    if (metaRes.data.mimeType === "application/vnd.google-apps.shortcut" && metaRes.data.shortcutDetails?.targetId) {
      activeFileId = metaRes.data.shortcutDetails.targetId;
      metaRes = await drive.files.get({
        fileId: activeFileId,
        fields: "id, name, mimeType, size",
        supportsAllDrives: true,
      });
    }

    const fileSize = parseInt(metaRes.data.size || "0", 10);
    const mimeType = metaRes.data.mimeType || "video/mp4";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    return new NextResponse(null, { status: 500 });
  }
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

    // 2. Compute Byte Ranges with dynamic chunking.
    // Crucial: Google Drive enforces strict per-request download quotas.
    // Requesting unbounded multi-gigabyte ranges (e.g. bytes=0-) causes Google Drive
    // to return HTTP 403 "downloadQuotaExceeded" and exceeds Vercel's serverless timeout.
    // By streaming in manageable 1.5MB - 2.5MB slices, the browser can buffer continuously,
    // seek freely, and never trigger Google Drive's download quota threshold.
    const TARGET_CHUNK_SIZE = 1572864; // 1.5 MB default slice
    const MAX_CHUNK_SIZE = 2621440;    // 2.5 MB maximum chunk cap
    const rangeHeader = request.headers.get("range");

    let start = 0;
    let end = fileSize > 0 ? fileSize - 1 : TARGET_CHUNK_SIZE - 1;

    if (rangeHeader && fileSize > 0) {
      const cleanRange = rangeHeader.replace(/^bytes=/, "").trim();
      const parts = cleanRange.split("-");

      if (parts[0] === "" && parts[1]) {
        // Suffix range: bytes=-500 (requesting last N bytes)
        const suffix = parseInt(parts[1], 10);
        start = Math.max(0, fileSize - suffix);
        end = fileSize - 1;
      } else {
        start = parseInt(parts[0], 10) || 0;
        if (parts[1] && parts[1].trim() !== "") {
          end = parseInt(parts[1], 10);
        } else {
          // Open-ended range (e.g. bytes=0- or bytes=1000000-)
          end = Math.min(start + TARGET_CHUNK_SIZE - 1, fileSize - 1);
        }
      }
    } else if (fileSize > 0) {
      // Direct GET without Range: serve first chunk with Accept-Ranges so player initiates range requests
      start = 0;
      end = Math.min(TARGET_CHUNK_SIZE - 1, fileSize - 1);
    }

    // Cap chunk size to MAX_CHUNK_SIZE to prevent quota exhaustion and timeouts
    if (end - start + 1 > MAX_CHUNK_SIZE) {
      end = Math.min(start + MAX_CHUNK_SIZE - 1, fileSize - 1);
    }
    if (fileSize > 0 && end >= fileSize) {
      end = fileSize - 1;
    }

    // Helper to fetch range from Google Drive with auto-fallback to smaller chunk if quota limits are flagged
    const fetchRangeFromDrive = async (fetchStart: number, fetchEnd: number) => {
      try {
        return await drive.files.get(
          {
            fileId: activeFileId,
            alt: "media",
            supportsAllDrives: true,
          },
          {
            responseType: "stream",
            headers: {
              Range: `bytes=${fetchStart}-${fetchEnd}`,
            },
          }
        );
      } catch (firstErr: any) {
        const errMsg = String(firstErr?.message || "");
        // If quota was exceeded on larger chunk, step down to 512KB
        if (errMsg.includes("downloadQuotaExceeded") || firstErr?.status === 403 || firstErr?.code === 403) {
          const reducedEnd = Math.min(fetchStart + 524288 - 1, fileSize > 0 ? fileSize - 1 : fetchStart + 524287);
          if (reducedEnd < fetchEnd) {
            console.warn(`[GDrive Stream] Stepping down chunk size for ${activeFileId} (${fetchStart}-${reducedEnd}) due to quota`);
            const fallbackRes = await drive.files.get(
              {
                fileId: activeFileId,
                alt: "media",
                supportsAllDrives: true,
              },
              {
                responseType: "stream",
                headers: {
                  Range: `bytes=${fetchStart}-${reducedEnd}`,
                },
              }
            );
            return { res: fallbackRes, actualEnd: reducedEnd };
          }
        }
        throw firstErr;
      }
    };

    let driveResponse: any;
    let actualEnd = end;

    const streamResult = await fetchRangeFromDrive(start, end);
    if ("res" in streamResult) {
      driveResponse = streamResult.res;
      actualEnd = streamResult.actualEnd;
    } else {
      driveResponse = streamResult;
    }

    const actualChunkSize = actualEnd - start + 1;
    const nodeStream = driveResponse.data as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream);

    return new NextResponse(webStream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${actualEnd}/${fileSize || "*"}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(actualChunkSize),
        "Content-Type": mimeType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error: any) {
    console.error("GDrive video streaming error:", error);
    return NextResponse.json({ error: error.message || "Failed to stream video from Google Drive" }, { status: 500 });
  }
}
