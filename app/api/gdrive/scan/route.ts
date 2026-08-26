import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentSessionUser } from "@/src/lib/session";
import { getMovies } from "@/src/lib/data-service";
import { searchTmdbMulti, fetchTmdbMetadata } from "@/src/lib/tmdb";

function cleanMovieTitle(rawName: string): { title: string; year?: number } {
  // Remove file extension
  let clean = rawName.replace(/\.[a-zA-Z0-9]{2,4}$/, "");

  // Extract year if present, e.g. (2022) or .2022. or - 2022
  let year: number | undefined;
  const yearMatch = clean.match(/[\(\[\.\-\s](19\d\d|20\d\d)[\)\]\.\-\s]?/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1], 10);
  }

  // Remove common video tags
  clean = clean
    .replace(/[\(\[](19\d\d|20\d\d)[\)\]]/g, "")
    .replace(/[\._]/g, " ")
    .replace(/\b(1080p|720p|2160p|4k|uhd|bluray|blu-ray|web-dl|webrip|hdrip|dvdrip|x264|x265|hevc|aac|ac3|dts|remux|hdr|sub_indo|sub_eng)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return { title: clean || rawName, year };
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const folderIdParam = searchParams.get("folderId") || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderIdParam || folderIdParam === "YOUR_GOOGLE_DRIVE_FOLDER_ID") {
      return NextResponse.json(
        { error: "GOOGLE_DRIVE_FOLDER_ID is not configured in .env or provided in request." },
        { status: 400 }
      );
    }

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: "Google Drive service account credentials are not configured in .env." },
        { status: 400 }
      );
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Fetch existing movies in database to detect duplicates
    const existingMovies = await getMovies({});
    const existingTitles = new Set(existingMovies.map((m) => m.title.toLowerCase().trim()));
    const existingUrls = new Set(existingMovies.map((m) => m.videoUrl.trim()));

    // 1. List all items in the root folder (subfolders and standalone files)
    const listRes = await drive.files.list({
      q: `'${folderIdParam}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, size, modifiedTime)",
      pageSize: 200,
    });

    const items = listRes.data.files || [];
    const scannedMovies: any[] = [];

    // Video MIME types and extensions
    const isVideoFile = (mime?: string, name?: string) => {
      if (mime && mime.startsWith("video/")) return true;
      if (name && /\.(mp4|mkv|webm|avi|mov|m4v|ts)$/i.test(name)) return true;
      return false;
    };

    const isSubtitleFile = (name?: string) => {
      return name && /\.(vtt|srt|ass|sub)$/i.test(name);
    };

    for (const item of items) {
      if (!item.id || !item.name) continue;

      // ── CASE A: Item is a subfolder (e.g. "Avatar (2009)" folder) ──────────
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const subfolderRes = await drive.files.list({
          q: `'${item.id}' in parents and trashed = false`,
          fields: "files(id, name, mimeType, size)",
          pageSize: 50,
        });

        const subfiles = subfolderRes.data.files || [];
        const videoFile = subfiles.find((f) => isVideoFile(f.mimeType, f.name));
        const subtitleFiles = subfiles.filter((f) => isSubtitleFile(f.name));

        if (videoFile && videoFile.id) {
          const { title: parsedTitle, year: parsedYear } = cleanMovieTitle(item.name);
          const videoUrl = `https://drive.google.com/uc?export=download&id=${videoFile.id}`;

          // Format subtitles
          const detectedSubtitles = subtitleFiles.map((sub, idx) => {
            const isIndo = /indo|id|bahasa/i.test(sub.name || "");
            const langCode = isIndo ? "id" : "en";
            const langLabel = isIndo ? "Bahasa Indonesia" : "English";
            return {
              id: `sub-${Date.now()}-${idx}`,
              language: langCode,
              label: langLabel,
              fileUrl: `https://drive.google.com/uc?id=${sub.id}`,
            };
          });

          // TMDB search
          let tmdbData: any = null;
          try {
            const tmdbResults = await searchTmdbMulti(parsedTitle);
            const bestMatch = tmdbResults.find((r) => r.type === "movie" || r.type === "series");
            if (bestMatch && bestMatch.tmdbId) {
              const fullTmdb = await fetchTmdbMetadata(bestMatch.type as any, String(bestMatch.tmdbId));
              tmdbData = fullTmdb;
            }
          } catch {}

          const alreadyInDb =
            existingTitles.has(parsedTitle.toLowerCase()) ||
            (tmdbData && existingTitles.has(tmdbData.title.toLowerCase())) ||
            existingUrls.has(videoUrl);

          scannedMovies.push({
            id: `gdrive-${item.id}`,
            folderId: item.id,
            rawName: item.name,
            title: tmdbData?.title || parsedTitle,
            releaseYear: tmdbData?.releaseYear || parsedYear || new Date().getFullYear(),
            description: tmdbData?.description || `${parsedTitle} from Google Drive.`,
            posterUrl: tmdbData?.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80",
            backdropUrl: tmdbData?.backdropUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
            videoUrl,
            duration: tmdbData?.duration || 120,
            rating: tmdbData?.rating || 7.5,
            ageRating: tmdbData?.ageRating || "PG-13",
            quality: "Full HD",
            genres: tmdbData?.genres || ["Action", "Drama"],
            cast: tmdbData?.cast || [],
            directors: tmdbData?.directors || [],
            country: tmdbData?.country || "United States",
            language: tmdbData?.language || "English",
            contentType: tmdbData?.contentType || "movie",
            subtitles: detectedSubtitles,
            alreadyInDb,
            tmdbMatched: Boolean(tmdbData),
          });
        }
      }
      // ── CASE B: Standalone video file directly in root folder ──────────────
      else if (isVideoFile(item.mimeType, item.name)) {
        const { title: parsedTitle, year: parsedYear } = cleanMovieTitle(item.name);
        const videoUrl = `https://drive.google.com/uc?export=download&id=${item.id}`;

        let tmdbData: any = null;
        try {
          const tmdbResults = await searchTmdbMulti(parsedTitle);
          const bestMatch = tmdbResults.find((r) => r.type === "movie" || r.type === "series");
          if (bestMatch && bestMatch.tmdbId) {
            const fullTmdb = await fetchTmdbMetadata(bestMatch.type as any, String(bestMatch.tmdbId));
            tmdbData = fullTmdb;
          }
        } catch {}

        const alreadyInDb =
          existingTitles.has(parsedTitle.toLowerCase()) ||
          (tmdbData && existingTitles.has(tmdbData.title.toLowerCase())) ||
          existingUrls.has(videoUrl);

        scannedMovies.push({
          id: `gdrive-${item.id}`,
          fileId: item.id,
          rawName: item.name,
          title: tmdbData?.title || parsedTitle,
          releaseYear: tmdbData?.releaseYear || parsedYear || new Date().getFullYear(),
          description: tmdbData?.description || `${parsedTitle} from Google Drive.`,
          posterUrl: tmdbData?.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80",
          backdropUrl: tmdbData?.backdropUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
          videoUrl,
          duration: tmdbData?.duration || 120,
          rating: tmdbData?.rating || 7.5,
          ageRating: tmdbData?.ageRating || "PG-13",
          quality: "Full HD",
          genres: tmdbData?.genres || ["Action", "Drama"],
          cast: tmdbData?.cast || [],
          directors: tmdbData?.directors || [],
          country: tmdbData?.country || "United States",
          language: tmdbData?.language || "English",
          contentType: tmdbData?.contentType || "movie",
          subtitles: [],
          alreadyInDb,
          tmdbMatched: Boolean(tmdbData),
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: scannedMovies.length,
      newCount: scannedMovies.filter((m) => !m.alreadyInDb).length,
      movies: scannedMovies,
    });
  } catch (error: any) {
    console.error("GDrive scan error:", error);
    return NextResponse.json({ error: error.message || "Failed to scan Google Drive folder" }, { status: 500 });
  }
}
