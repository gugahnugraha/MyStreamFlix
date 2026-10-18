import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentSessionUser } from "@/src/lib/session";
import { getMovies } from "@/src/lib/data-service";
import { searchTmdbMulti, fetchTmdbMetadata } from "@/src/lib/tmdb";

function cleanMovieTitle(rawName: string): { 
  title: string; 
  year?: number; 
  isSeries?: boolean; 
  seasonNumber?: number; 
  episodeNumber?: number; 
} {
  // Remove file extension
  let clean = rawName.replace(/\.[a-zA-Z0-9]{2,5}$/, "");

  // Detect TV Series patterns, e.g. S01E02, s1e2, 1x02, EP02
  let isSeries = false;
  let seasonNumber: number | undefined;
  let episodeNumber: number | undefined;

  const sEpMatch = clean.match(/[\s\.\-_][sS](\d{1,2})[\s\.\-_]?[eE](\d{1,2})/i);
  if (sEpMatch) {
    isSeries = true;
    seasonNumber = parseInt(sEpMatch[1], 10);
    episodeNumber = parseInt(sEpMatch[2], 10);
  } else {
    const xMatch = clean.match(/[\s\.\-_](\d{1,2})x(\d{1,2})/i);
    if (xMatch) {
      isSeries = true;
      seasonNumber = parseInt(xMatch[1], 10);
      episodeNumber = parseInt(xMatch[2], 10);
    } else {
      const epMatch = clean.match(/[\s\.\-_](?:ep|episode)[\s\.\-_]?(\d{1,3})/i);
      if (epMatch) {
        isSeries = true;
        seasonNumber = 1;
        episodeNumber = parseInt(epMatch[1], 10);
      }
    }
  }

  // Extract year if present, e.g. (2022) or .2022. or - 2022
  let year: number | undefined;
  const yearMatch = clean.match(/[\(\[\.\-\s](19\d\d|20\d\d)[\)\]\.\-\s]?/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1], 10);
  }

  // Remove series tag from title clean
  clean = clean
    .replace(/[\s\.\-_][sS]\d{1,2}[\s\.\-_]?[eE]\d{1,2}.*$/i, "")
    .replace(/[\s\.\-_]\d{1,2}x\d{1,2}.*$/i, "")
    .replace(/[\s\.\-_](?:ep|episode)[\s\.\-_]?\d{1,3}.*$/i, "");

  // Remove common video tags
  clean = clean
    .replace(/[\(\[](19\d\d|20\d\d)[\)\]]/g, "")
    .replace(/[\._]/g, " ")
    .replace(/\b(1080p|720p|2160p|4k|uhd|bluray|blu-ray|web-dl|webrip|hdrip|dvdrip|x264|x265|hevc|aac|ac3|dts|remux|hdr|sub_indo|sub_eng|rarbg|yts|yify|galaxy)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return { 
    title: clean || rawName.replace(/\.[a-zA-Z0-9]{2,5}$/, ""), 
    year, 
    isSeries, 
    seasonNumber, 
    episodeNumber 
  };
}

// Video MIME types and extensions
const isVideoFile = (mime?: string, name?: string) => {
  if (mime && (mime.startsWith("video/") || mime === "application/x-matroska" || mime === "application/vnd.rn-realmedia")) {
    return true;
  }
  if (name && /\.(mp4|mkv|webm|avi|mov|m4v|ts|flv|wmv|3gp|m2ts)$/i.test(name)) {
    return true;
  }
  return false;
};

// Subtitle extensions
const isSubtitleFile = (name?: string) => {
  return name && /\.(vtt|srt|ass|sub|ssa)$/i.test(name);
};

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

    // BFS Queue to scan folders recursively for video files
    interface QueueItem {
      id: string;
      path: string;
    }

    const queue: QueueItem[] = [{ id: folderIdParam, path: "" }];
    const visitedFolders = new Set<string>([folderIdParam]);

    interface DiscoveredVideo {
      file: any;
      folderId: string;
      folderPath: string;
    }

    const discoveredVideos: DiscoveredVideo[] = [];
    const folderSubtitles: Record<string, any[]> = {};

    let foldersScanned = 0;
    const MAX_FOLDERS = 40;
    const MAX_VIDEOS = 150;

    while (queue.length > 0 && foldersScanned < MAX_FOLDERS && discoveredVideos.length < MAX_VIDEOS) {
      const current = queue.shift()!;
      foldersScanned++;

      try {
        const listRes = await drive.files.list({
          q: `'${current.id}' in parents and trashed = false`,
          fields: "files(id, name, mimeType, size, modifiedTime)",
          pageSize: 200,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const items = listRes.data.files || [];
        for (const item of items) {
          if (!item.id || !item.name) continue;

          // If item is a subfolder, add to queue to explore video files inside it
          if (item.mimeType === "application/vnd.google-apps.folder") {
            if (!visitedFolders.has(item.id)) {
              visitedFolders.add(item.id);
              const nextPath = current.path ? `${current.path} / ${item.name}` : item.name;
              queue.push({ id: item.id, path: nextPath });
            }
          } 
          // If item is a VIDEO FILE (mp4, mkv, etc.), collect it!
          else if (isVideoFile(item.mimeType, item.name)) {
            discoveredVideos.push({
              file: item,
              folderId: current.id,
              folderPath: current.path,
            });
          } 
          // If item is a subtitle file, keep track for association
          else if (isSubtitleFile(item.name)) {
            if (!folderSubtitles[current.id]) folderSubtitles[current.id] = [];
            folderSubtitles[current.id].push(item);
          }
        }
      } catch (folderErr) {
        console.warn(`[GDrive Scan] Could not scan folder ${current.id}:`, folderErr);
      }
    }

    const scannedMovies: any[] = [];

    // Process each discovered VIDEO FILE (NOT folders!)
    for (const item of discoveredVideos) {
      const videoFile = item.file;
      const { title: parsedTitle, year: parsedYear, isSeries, seasonNumber, episodeNumber } = cleanMovieTitle(videoFile.name);

      const videoUrl = `https://drive.google.com/uc?export=download&id=${videoFile.id}`;
      const ext = (videoFile.name.split(".").pop() || "mp4").toUpperCase();

      // Find subtitles in the same folder that match this video or language codes
      const subsInFolder = folderSubtitles[item.folderId] || [];
      const baseVideoName = videoFile.name.replace(/\.[a-zA-Z0-9]{2,5}$/, "").toLowerCase();

      const detectedSubtitles = subsInFolder
        .filter((sub) => {
          const subLower = (sub.name || "").toLowerCase();
          // Check if subtitle matches the video base name or is the only subtitle for this folder
          return subsInFolder.length <= 4 || subLower.includes(baseVideoName) || baseVideoName.includes(subLower.replace(/\.[a-z0-9]+$/i, ""));
        })
        .map((sub, idx) => {
          const isIndo = /indo|id\b|indonesia|bahasa/i.test(sub.name || "");
          const isSpan = /spa|es\b|spanish/i.test(sub.name || "");
          const langCode = isIndo ? "id" : isSpan ? "es" : "en";
          const langLabel = isIndo ? "Bahasa Indonesia" : isSpan ? "Español" : "English";
          return {
            id: `sub-${videoFile.id}-${idx}`,
            language: langCode,
            label: langLabel,
            fileUrl: `https://drive.google.com/uc?id=${sub.id}`,
            fileName: sub.name,
          };
        });

      // Strictly prioritize Indonesian (#1) and English (#2) at the top of the subtitles list
      detectedSubtitles.sort((a, b) => {
        const getPriority = (lang: string) => {
          const l = (lang || "").toLowerCase().trim();
          if (l === "id" || l === "ind" || l === "in") return 1;
          if (l === "en" || l === "eng") return 2;
          return 3;
        };
        const pA = getPriority(a.language);
        const pB = getPriority(b.language);
        if (pA !== pB) return pA - pB;
        return a.label.localeCompare(b.label);
      });

      // TMDB Search with the cleaned title from the video file
      let tmdbData: any = null;
      try {
        const tmdbResults = await searchTmdbMulti(parsedTitle);
        const preferredType = isSeries ? "series" : "movie";
        const bestMatch = 
          tmdbResults.find((r) => r.type === preferredType) || 
          tmdbResults.find((r) => r.type === "movie" || r.type === "series");

        if (bestMatch && bestMatch.tmdbId) {
          const fullTmdb = await fetchTmdbMetadata(bestMatch.type as any, String(bestMatch.tmdbId));
          tmdbData = fullTmdb;
        }
      } catch (tmdbErr) {
        console.warn(`[GDrive Scan] TMDB search failed for "${parsedTitle}":`, tmdbErr);
      }

      const finalTitle = tmdbData?.title || parsedTitle;
      const alreadyInDb =
        existingTitles.has(parsedTitle.toLowerCase()) ||
        (tmdbData && existingTitles.has(tmdbData.title.toLowerCase())) ||
        existingUrls.has(videoUrl);

      // Determine content type
      const contentType = isSeries ? "series" : (tmdbData?.contentType || "movie");

      // Build seasons structure if series episode detected
      let seriesSeasons: any[] = [];
      if (contentType === "series") {
        const sNum = seasonNumber || 1;
        const eNum = episodeNumber || 1;
        seriesSeasons = [
          {
            id: `sea-${Date.now()}-1`,
            seasonNumber: sNum,
            title: `Season ${sNum}`,
            episodes: [
              {
                id: `ep-${videoFile.id}`,
                episodeNumber: eNum,
                title: `${finalTitle} - Episode ${eNum}`,
                duration: tmdbData?.duration || 45,
                videoUrl,
                description: tmdbData?.description || `${finalTitle} Season ${sNum} Episode ${eNum}.`,
                subtitles: detectedSubtitles,
                stillUrl: tmdbData?.backdropUrl || "",
              },
            ],
          },
        ];
      }

      scannedMovies.push({
        id: `gdrive-${videoFile.id}`,
        fileId: videoFile.id,
        fileName: videoFile.name,
        rawName: videoFile.name,
        folderPath: item.folderPath || "Root",
        fileExtension: ext,
        fileSizeBytes: parseInt(videoFile.size || "0", 10),
        title: finalTitle,
        releaseYear: tmdbData?.releaseYear || parsedYear || new Date().getFullYear(),
        description: tmdbData?.description || `${finalTitle} from Google Drive.`,
        posterUrl: tmdbData?.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80",
        backdropUrl: tmdbData?.backdropUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
        videoUrl,
        duration: tmdbData?.duration || (contentType === "series" ? 45 : 120),
        rating: tmdbData?.rating || 7.5,
        ageRating: tmdbData?.ageRating || "PG-13",
        quality: videoFile.name.toLowerCase().includes("2160p") || videoFile.name.toLowerCase().includes("4k") ? "4K" : "Full HD",
        genres: tmdbData?.genres || ["Action", "Drama"],
        cast: tmdbData?.cast || [],
        directors: tmdbData?.directors || [],
        country: tmdbData?.country || "United States",
        language: tmdbData?.language || "English",
        contentType,
        seasons: seriesSeasons,
        subtitles: detectedSubtitles,
        alreadyInDb,
        tmdbMatched: Boolean(tmdbData),
        seasonNumber,
        episodeNumber,
      });
    }

    return NextResponse.json({
      success: true,
      count: scannedMovies.length,
      newCount: scannedMovies.filter((m) => !m.alreadyInDb).length,
      foldersScanned,
      movies: scannedMovies,
    });
  } catch (error: any) {
    console.error("GDrive scan error:", error);
    return NextResponse.json({ error: error.message || "Failed to scan Google Drive video files" }, { status: 500 });
  }
}
