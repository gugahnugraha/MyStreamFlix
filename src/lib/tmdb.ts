import { TmdbCastMember, TmdbPersonDetail, TmdbCreditItem } from "@/src/types";

export const getTmdbApiKey = () => {
  const key = (process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY)?.trim();
  if (!key || key === "MY_TMDB_API_KEY") return "";
  return key;
};

const tmdbImage = (pathValue?: string | null, size = "w185") => {
  return pathValue ? `https://image.tmdb.org/t/p/${size}${pathValue}` : "";
};

const getLanguageName = (code?: string) => {
  if (!code) return "English";
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

const getMovieCertification = (releaseDates: any) => {
  const usRelease = releaseDates?.results?.find((item: any) => item.iso_3166_1 === "US");
  const certification = usRelease?.release_dates?.find((item: any) => item.certification)?.certification;
  return certification || "PG-13";
};

const getTvCertification = (contentRatings: any) => {
  const usRating = contentRatings?.results?.find((item: any) => item.iso_3166_1 === "US");
  return usRating?.rating || "PG-13";
};

export async function searchTmdbMulti(query: string) {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    include_adult: "false",
    language: "en-US",
    page: "1"
  });

  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/multi?${params.toString()}`);
    if (!response.ok) {
      console.warn(`TMDB search failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.results || [])
      .filter((item: any) => ["movie", "tv", "person"].includes(item.media_type))
      .slice(0, 8)
      .map((item: any) => {
        if (item.media_type === "person") {
          const knownFor = (item.known_for || [])
            .map((entry: any) => entry.title || entry.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(", ");

          return {
            id: `tmdb-person-${item.id}`,
            tmdbId: item.id,
            source: "tmdb",
            type: "cast",
            title: item.name,
            subtitle: knownFor ? `Cast • ${knownFor}` : "Cast",
            posterUrl: tmdbImage(item.profile_path),
            query: item.name
          };
        }

        const isMovie = item.media_type === "movie";
        const title = isMovie ? item.title : item.name;
        const dateValue = isMovie ? item.release_date : item.first_air_date;
        const year = dateValue ? new Date(dateValue).getFullYear() : "";

        return {
          id: `tmdb-${item.media_type}-${item.id}`,
          tmdbId: item.id,
          source: "tmdb",
          type: isMovie ? "movie" : "series",
          title,
          subtitle: `${isMovie ? "Movie" : "TV Series"}${year ? ` • ${year}` : ""}`,
          posterUrl: tmdbImage(item.poster_path),
          backdropUrl: tmdbImage(item.backdrop_path, "w780"),
          query: title
        };
      });
  } catch (error) {
    console.warn("TMDB suggestion query failed:", error);
    return [];
  }
}

export async function fetchTmdbMetadata(mediaType: "movie" | "tv", tmdbId: string) {
  const apiKey = getTmdbApiKey();
  if (!apiKey) throw new Error("TMDB_API_KEY is not configured.");

  const append = mediaType === "movie" ? "credits,release_dates" : "credits,content_ratings";
  const params = new URLSearchParams({
    api_key: apiKey,
    append_to_response: append,
    language: "en-US"
  });

  const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB metadata lookup failed with status ${response.status}.`);
  }

  const data = await response.json();
  const isMovie = mediaType === "movie";
  const title = isMovie ? data.title : data.name;
  const dateValue = isMovie ? data.release_date : data.first_air_date;
  const directors = isMovie
    ? (data.credits?.crew || [])
        .filter((person: any) => person.job === "Director")
        .map((person: any) => person.name)
    : [
        ...(data.created_by || []).map((person: any) => person.name),
        ...(data.credits?.crew || [])
          .filter((person: any) => person.job === "Director" || person.job === "Executive Producer")
          .map((person: any) => person.name)
      ];

  return {
    tmdbId: data.id,
    tmdbMediaType: mediaType,
    contentType: isMovie ? "movie" : "series",
    title,
    description: data.overview || "",
    posterUrl: tmdbImage(data.poster_path, "w500"),
    backdropUrl: tmdbImage(data.backdrop_path, "w1280"),
    duration: isMovie ? (data.runtime || 120) : (data.episode_run_time?.[0] || 45),
    releaseYear: dateValue ? new Date(dateValue).getFullYear() : new Date().getFullYear(),
    rating: data.vote_average ? Number(data.vote_average.toFixed(1)) : 7.5,
    ageRating: isMovie ? getMovieCertification(data.release_dates) : getTvCertification(data.content_ratings),
    genres: (data.genres || []).map((genre: any) => genre.name),
    cast: (data.credits?.cast || []).slice(0, 10).map((person: any) => person.name),
    directors: Array.from(new Set(directors.filter(Boolean))).slice(0, 5),
    country: data.production_countries?.[0]?.name || data.origin_country?.[0] || "United States",
    language: getLanguageName(data.original_language),
    seasonsCount: data.number_of_seasons || 1,
    episodesPerSeason: data.number_of_episodes && data.number_of_seasons
      ? Math.max(1, Math.round(data.number_of_episodes / data.number_of_seasons))
      : 5,
    seasons: !isMovie && Array.isArray(data.seasons)
      ? data.seasons
          .filter((season: any) => season.season_number > 0)
          .slice(0, 8)
          .map((season: any) => ({
            id: `tmdb-s${season.season_number}-${Date.now()}`,
            seasonNumber: season.season_number,
            title: season.name || `Season ${season.season_number}`,
            episodes: Array.from({ length: Math.min(season.episode_count || 1, 12) }, (_, idx) => ({
              id: `tmdb-s${season.season_number}-e${idx + 1}-${Date.now()}`,
              episodeNumber: idx + 1,
              title: `Episode ${idx + 1}`,
              duration: data.episode_run_time?.[0] || 45,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              description: ""
            }))
          }))
      : []
  };
}

export async function fetchTmdbMovieCredits(
  mediaType: "movie" | "tv",
  tmdbId: string | number
): Promise<TmdbCastMember[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey || !tmdbId) return [];

  try {
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${apiKey}&language=en-US`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.warn(`TMDB credits fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.cast || [])
      .slice(0, 24)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        character: item.character || "",
        profilePath: item.profile_path ? tmdbImage(item.profile_path, "w185") : "",
        order: item.order ?? 0,
        knownForDepartment: item.known_for_department || "Acting"
      }));
  } catch (err) {
    console.warn("Failed to fetch TMDB credits:", err);
    return [];
  }
}

export async function searchTmdbId(
  title: string,
  mediaType: "movie" | "tv" = "movie",
  year?: number
): Promise<number | null> {
  const apiKey = getTmdbApiKey();
  if (!apiKey || !title) return null;

  try {
    const searchUrl = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
    searchUrl.searchParams.set("api_key", apiKey);
    searchUrl.searchParams.set("query", title);
    searchUrl.searchParams.set("language", "en-US");
    searchUrl.searchParams.set("include_adult", "false");
    if (year) {
      if (mediaType === "movie") {
        searchUrl.searchParams.set("year", String(year));
      } else {
        searchUrl.searchParams.set("first_air_date_year", String(year));
      }
    }

    let res = await fetch(searchUrl.toString(), { next: { revalidate: 86400 } });
    if (!res.ok && year) {
      searchUrl.searchParams.delete("year");
      searchUrl.searchParams.delete("first_air_date_year");
      res = await fetch(searchUrl.toString(), { next: { revalidate: 86400 } });
    }

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].id;
      }
    }

    const multiUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
      title
    )}&language=en-US`;
    const multiRes = await fetch(multiUrl, { next: { revalidate: 86400 } });
    if (multiRes.ok) {
      const multiData = await multiRes.json();
      const match = (multiData.results || []).find(
        (item: any) => item.media_type === "movie" || item.media_type === "tv"
      );
      if (match) return match.id;
    }

    return null;
  } catch (err) {
    console.warn("Failed to search TMDB ID by title:", err);
    return null;
  }
}

export async function searchTmdbPerson(query: string) {
  const apiKey = getTmdbApiKey();
  if (!apiKey || !query.trim()) return [];

  const params = new URLSearchParams({
    api_key: apiKey,
    query: query.trim(),
    include_adult: "false",
    language: "en-US",
    page: "1"
  });

  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/person?${params.toString()}`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) {
      console.warn(`TMDB person search failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.results || [])
      .slice(0, 6)
      .map((item: any) => {
        const knownFor = (item.known_for || [])
          .map((entry: any) => entry.title || entry.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(", ");

        return {
          id: `tmdb-cast-${item.id}`,
          castId: String(item.id),
          tmdbId: item.id,
          source: "tmdb" as const,
          type: "cast" as const,
          title: item.name,
          subtitle: knownFor ? `Cast • ${knownFor}` : "Cast",
          posterUrl: tmdbImage(item.profile_path, "w185"),
          query: item.name
        };
      });
  } catch (error) {
    console.warn("TMDB person search error:", error);
    return [];
  }
}

export async function fetchTmdbPersonDetails(
  personId: string | number
): Promise<TmdbPersonDetail | null> {
  const apiKey = getTmdbApiKey();
  if (!apiKey || !personId) return null;

  try {
    let resolvedId = String(personId).trim();
    if (!/^\d+$/.test(resolvedId)) {
      const candidates = await searchTmdbPerson(resolvedId);
      if (candidates.length > 0 && candidates[0].tmdbId) {
        resolvedId = String(candidates[0].tmdbId);
      } else {
        return null;
      }
    }

    const url = `https://api.themoviedb.org/3/person/${resolvedId}?api_key=${apiKey}&append_to_response=combined_credits,external_ids&language=en-US`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      console.warn(`TMDB person lookup failed with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const castCredits: TmdbCreditItem[] = (data.combined_credits?.cast || [])
      .filter((c: any) => c.title || c.name)
      .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 36)
      .map((c: any) => {
        const isMovie = c.media_type === "movie";
        const title = isMovie ? c.title : c.name;
        const dateVal = isMovie ? c.release_date : c.first_air_date;
        const releaseYear = dateVal ? new Date(dateVal).getFullYear() : "";

        return {
          id: c.id,
          title,
          character: c.character || "",
          posterUrl: tmdbImage(c.poster_path, "w342"),
          backdropUrl: tmdbImage(c.backdrop_path, "w780"),
          releaseYear,
          rating: c.vote_average ? Number(c.vote_average.toFixed(1)) : undefined,
          mediaType: (c.media_type === "tv" ? "tv" : "movie") as "movie" | "tv",
          overview: c.overview || ""
        };
      });

    return {
      id: data.id,
      name: data.name,
      biography: data.biography || "",
      birthday: data.birthday || "",
      deathday: data.deathday || null,
      placeOfBirth: data.place_of_birth || "",
      profilePath: tmdbImage(data.profile_path, "h632") || tmdbImage(data.profile_path, "w500"),
      knownForDepartment: data.known_for_department || "Acting",
      popularity: data.popularity,
      credits: castCredits,
      externalIds: {
        imdbId: data.external_ids?.imdb_id,
        instagramId: data.external_ids?.instagram_id,
        twitterId: data.external_ids?.twitter_id,
        facebookId: data.external_ids?.facebook_id
      }
    };
  } catch (err) {
    console.warn("Failed to fetch TMDB person details:", err);
    return null;
  }
}

