import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/src/lib/session";

// Mapping ISO 639-2 / 639-1 / 3-letter codes to standard 2-letter code & human label
const LANGUAGE_META: Record<string, { code: string; label: string }> = {
  ind: { code: "id", label: "Bahasa Indonesia" },
  id: { code: "id", label: "Bahasa Indonesia" },
  in: { code: "id", label: "Bahasa Indonesia" },
  indonesian: { code: "id", label: "Bahasa Indonesia" },
  indonesia: { code: "id", label: "Bahasa Indonesia" },
  eng: { code: "en", label: "English" },
  en: { code: "en", label: "English" },
  spa: { code: "es", label: "Español" },
  es: { code: "es", label: "Español" },
  ara: { code: "ar", label: "العربية (Arabic)" },
  ar: { code: "ar", label: "العربية (Arabic)" },
  fre: { code: "fr", label: "Français" },
  fra: { code: "fr", label: "Français" },
  fr: { code: "fr", label: "Français" },
  kor: { code: "ko", label: "한국어 (Korean)" },
  ko: { code: "ko", label: "한국어 (Korean)" },
  jpn: { code: "ja", label: "日本語 (Japanese)" },
  ja: { code: "ja", label: "日本語 (Japanese)" },
  zht: { code: "zh", label: "中文 (Chinese)" },
  zh: { code: "zh", label: "中文 (Chinese)" },
  chi: { code: "zh", label: "中文 (Chinese)" },
  rus: { code: "ru", label: "Русский (Russian)" },
  ru: { code: "ru", label: "Русский (Russian)" },
  ger: { code: "de", label: "Deutsch" },
  deu: { code: "de", label: "Deutsch" },
  de: { code: "de", label: "Deutsch" },
  por: { code: "pt", label: "Português" },
  pob: { code: "pt", label: "Português (Brasil)" },
  pt: { code: "pt", label: "Português" },
  may: { code: "ms", label: "Bahasa Melayu" },
  ms: { code: "ms", label: "Bahasa Melayu" },
  tha: { code: "th", label: "ไทย (Thai)" },
  th: { code: "th", label: "ไทย (Thai)" },
  vie: { code: "vi", label: "Tiếng Việt" },
  vi: { code: "vi", label: "Tiếng Việt" },
  tur: { code: "tr", label: "Türkçe" },
  tr: { code: "tr", label: "Türkçe" },
  hin: { code: "hi", label: "हिन्दी (Hindi)" },
  hi: { code: "hi", label: "हिन्दी (Hindi)" },
};

function normalizeLang(rawLang: string) {
  const clean = (rawLang || "").toLowerCase().trim();
  if (LANGUAGE_META[clean]) return LANGUAGE_META[clean];
  return { code: clean.substring(0, 2), label: clean.toUpperCase() };
}

function cleanTitleForSearch(raw: string): string {
  return (raw || "")
    .replace(/\.(mp4|mkv|avi|mov|wmv|webm|flv|m4v)$/i, "")
    .replace(/\b(1080p|720p|480p|2160p|4k|bluray|blu-ray|brrip|web-dl|webdl|webrip|hdrip|hdcam|unrated|extended|remastered|x264|x265|hevc|h264|yify|yts|bokutox|rarbg|eztv)\b/gi, "")
    .replace(/[\._\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || raw;
}

async function resolveImdbId(title: string, year?: number, tmdbId?: number | string, mediaType: string = "movie"): Promise<string | null> {
  const tmdbApiKey = process.env.TMDB_API_KEY?.trim();

  // 1. If TMDB ID is provided and TMDB API key is available
  if (tmdbId && tmdbApiKey && tmdbApiKey !== "MY_TMDB_API_KEY") {
    try {
      const type = mediaType === "series" ? "tv" : "movie";
      const res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${tmdbApiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.imdb_id) return data.imdb_id;
      }
    } catch (e) {
      console.warn("[Auto-Subtitle] TMDB external_ids fetch failed:", e);
    }
  }

  // 2. Query IMDb Suggestion Public API (Fast, Free, No API Key Required)
  try {
    const cleanQuery = cleanTitleForSearch(title).toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim().replace(/\s+/g, " ");
    const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(cleanQuery)}.json`;
    const res = await fetch(imdbUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (res.ok) {
      const data = await res.json();
      const results = (data.d || []).filter((item: any) => item.id && item.id.startsWith("tt"));
      if (results.length > 0) {
        // Find best match matching year if available
        if (year) {
          const yearMatch = results.find((item: any) => item.y === year || Math.abs((item.y || 0) - year) <= 1);
          if (yearMatch) return yearMatch.id;
        }
        return results[0].id;
      }
    }
  } catch (e) {
    console.warn("[Auto-Subtitle] IMDb suggestion lookup failed:", e);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const title = (body.title || "").trim();
    const year = body.year ? Number(body.year) : undefined;
    const tmdbId = body.tmdbId;
    const mediaType = body.mediaType || body.contentType || "movie";
    const requestedLangs = (body.languages || "id,en").toLowerCase().split(",").map((l: string) => l.trim());

    if (!title && !body.imdbId && !tmdbId) {
      return NextResponse.json({ error: "Judul tayangan atau ID TMDB diperlukan." }, { status: 400 });
    }

    // 1. Resolve IMDb ID
    let imdbId = body.imdbId;
    if (!imdbId) {
      imdbId = await resolveImdbId(title, year, tmdbId, mediaType);
    }

    if (!imdbId) {
      return NextResponse.json({
        error: `Tidak dapat menemukan ID IMDb untuk "${title}". Pastikan judul sesuai atau isi ID TMDB.`,
        subtitles: []
      }, { status: 404 });
    }

    const subtitlesFound: Array<{
      id: string;
      language: string;
      label: string;
      fileUrl: string;
      fileName?: string;
      source: string;
    }> = [];

    // 2. Fetch from OpenSubtitles Provider (High-speed Stremio OpenSubtitles v3 addon)
    try {
      const stremioType = mediaType === "series" ? "series" : "movie";
      // If series, default to S1:E1 or pass season/episode
      const endpointId = mediaType === "series"
        ? `${imdbId}:${body.seasonNumber || 1}:${body.episodeNumber || 1}`
        : imdbId;

      const stremioUrl = `https://opensubtitles-v3.strem.io/subtitles/${stremioType}/${endpointId}.json`;
      const res = await fetch(stremioUrl, {
        headers: { "User-Agent": "MyStreamFlix-Server/1.0" },
        cache: "no-store"
      });

      if (res.ok) {
        const data = await res.json();
        const rawSubs = Array.isArray(data.subtitles) ? data.subtitles : [];

        // 1. Prioritize Indonesian subtitle as primary goal (jika ada)
        let indoCount = 0;
        for (const raw of rawSubs) {
          const rawLang = (raw.lang || "").toLowerCase().trim();
          if (rawLang === "ind" || rawLang === "id" || rawLang === "in") {
            indoCount++;
            subtitlesFound.push({
              id: `sub-auto-id-${raw.id || Math.random().toString(36).substring(2, 7)}`,
              language: "id",
              label: indoCount === 1 ? "Bahasa Indonesia" : `Bahasa Indonesia (Sync ${indoCount})`,
              fileUrl: raw.url,
              fileName: raw.subtitleFileName || raw.movieReleaseName || `${title} (Bahasa Indonesia)`,
              source: "OpenSubtitles"
            });
            if (indoCount >= 2) break; // Keep up to 2 Indonesian releases
          }
        }

        // 2. Also check English only as fallback/secondary option if requested
        if (requestedLangs.includes("en") || requestedLangs.includes("eng")) {
          for (const raw of rawSubs) {
            const rawLang = (raw.lang || "").toLowerCase().trim();
            if (rawLang === "eng" || rawLang === "en") {
              subtitlesFound.push({
                id: `sub-auto-en-${raw.id || Math.random().toString(36).substring(2, 7)}`,
                language: "en",
                label: "English",
                fileUrl: raw.url,
                fileName: raw.subtitleFileName || raw.movieReleaseName || `${title} (English)`,
                source: "OpenSubtitles"
              });
              break;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("[Auto-Subtitle] OpenSubtitles Stremio query failed:", err);
    }

    // 3. Fallback/Complementary: Official OpenSubtitles.com API if OPENSUBTITLES_API_KEY is present
    const openSubKey = process.env.OPENSUBTITLES_API_KEY?.trim();
    if (subtitlesFound.length === 0 && openSubKey) {
      try {
        const openSubUrl = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId.replace("tt", "")}&languages=${requestedLangs.join(",")}`;
        const res = await fetch(openSubUrl, {
          headers: {
            "Api-Key": openSubKey,
            "User-Agent": "MyStreamFlix v1.0.0"
          }
        });
        if (res.ok) {
          const data = await res.json();
          for (const item of (data.data || [])) {
            const langCode = item.attributes?.language || "en";
            const langMeta = normalizeLang(langCode);
            const fileId = item.attributes?.files?.[0]?.file_id;
            if (fileId) {
              subtitlesFound.push({
                id: `sub-opensub-${langMeta.code}-${item.id}`,
                language: langMeta.code,
                label: langMeta.label,
                fileUrl: `https://api.opensubtitles.com/api/v1/download?file_id=${fileId}`,
                fileName: item.attributes?.release || `${title} (${langMeta.label})`,
                source: "OpenSubtitles Official"
              });
            }
          }
        }
      } catch (e) {
        console.warn("[Auto-Subtitle] Official OpenSubtitles query error:", e);
      }
    }

    // Strictly prioritize Bahasa Indonesia (#1) and English (#2) at the top of results
    subtitlesFound.sort((a, b) => {
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

    const hasIndonesian = subtitlesFound.some(s => s.language === "id");
    const hasEnglish = subtitlesFound.some(s => s.language === "en");

    return NextResponse.json({
      success: true,
      imdbId,
      title,
      totalFound: subtitlesFound.length,
      hasIndonesian,
      hasEnglish,
      subtitles: subtitlesFound
    });
  } catch (error: any) {
    console.error("[Auto-Subtitle] Handler error:", error);
    return NextResponse.json({ error: error.message || "Gagal mencari subtitle otomatis." }, { status: 500 });
  }
}
