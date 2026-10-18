/**
 * Automated synopsis translation helper for MyStreamFlix
 * Translates movie, series, and episode overviews from English to fluent Indonesian.
 */

// In-memory translation cache to avoid duplicate API requests
const translationCache = new Map<string, string>();

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function isLikelyEnglish(text: string): boolean {
  if (!text || text.trim().length < 10) return false;
  const englishWords = /\b(the|and|with|after|when|from|their|about|between|himself|herself|mysterious|discovers|father|mother|family|friends|world|story|life|school|young|girl|boy|vampire|vampires|death|dead|becomes|during|while|series|season|episode)\b/gi;
  const indonesianWords = /\b(yang|dan|di|dari|untuk|adalah|dengan|saat|ini|itu|sebuah|seorang|mereka|kehidupan|cerita|kematian|sekolah|gadis|keluarga|teman|ketika|menjadi|selama|oleh|pada|telah)\b/gi;
  
  const enCount = (text.match(englishWords) || []).length;
  const idCount = (text.match(indonesianWords) || []).length;
  return enCount > idCount;
}

export async function translateToIndonesian(text: string): Promise<string> {
  const clean = (text || "").trim();
  if (!clean) return "";

  // If already Indonesian, return as-is
  if (!isLikelyEnglish(clean)) {
    return clean;
  }

  // Check cache
  if (translationCache.has(clean)) {
    return translationCache.get(clean)!;
  }

  // Split into manageable sentence chunks (max ~350 chars each) to avoid MyMemory limit
  const rawSentences = clean.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [clean];
  const translatedChunks: string[] = [];

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (translationCache.has(trimmed)) {
      translatedChunks.push(translationCache.get(trimmed)!);
      continue;
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|id`;
      const res = await fetch(url, {
        headers: { "User-Agent": "MyStreamFlix/1.0" },
        next: { revalidate: 86400 } // Cache for 24 hours
      });

      if (res.ok) {
        const data = await res.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const translated = decodeHtmlEntities(data.responseData.translatedText.trim());
          translationCache.set(trimmed, translated);
          translatedChunks.push(translated);
          continue;
        }
      }
    } catch (err) {
      console.warn("MyMemory translation error for chunk:", err);
    }

    // Fallback: keep original chunk if translation failed
    translatedChunks.push(trimmed);
  }

  const result = translatedChunks.join(" ");
  translationCache.set(clean, result);
  return result;
}
