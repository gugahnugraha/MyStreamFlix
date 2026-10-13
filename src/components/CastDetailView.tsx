/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  MapPin, 
  Film, 
  Tv, 
  Play, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  Clapperboard,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Movie, TmdbPersonDetail, TmdbCreditItem } from "../types";

interface CastDetailViewProps {
  castId: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie?: (movie: Movie) => void;
  allMovies: Movie[];
  t: any;
}

export default function CastDetailView({
  castId,
  onBack,
  onSelectMovie,
  onPlayMovie,
  allMovies,
  t,
}: CastDetailViewProps) {
  const [person, setPerson] = useState<TmdbPersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "movie" | "tv">("all");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedPreviewCredit, setSelectedPreviewCredit] = useState<TmdbCreditItem | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchPerson() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/tmdb/person/${castId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Could not load cast profile (HTTP ${res.status})`);
        }
        const data: TmdbPersonDetail = await res.json();
        if (!isCancelled) {
          setPerson(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to load cast information.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (castId) {
      fetchPerson();
    }

    return () => {
      isCancelled = true;
    };
  }, [castId]);

  // Helper to find matching movie in local MyStreamFlix catalog
  const findCatalogMatch = (credit: TmdbCreditItem): Movie | undefined => {
    const cleanCreditTitle = credit.title.trim().toLowerCase();
    return allMovies.find((m) => {
      if (m.tmdbId && m.tmdbId === credit.id) return true;
      const cleanMovieTitle = m.title.trim().toLowerCase();
      return cleanMovieTitle === cleanCreditTitle;
    });
  };

  // Calculate age from birthday
  const getAge = (birthday?: string, deathday?: string | null) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6" id="cast-loading">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm text-zinc-400 font-medium">
            {t.loadingCastDetails || "Loading Cast Profile from TMDB..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6" id="cast-error">
        <div className="cinema-surface p-8 rounded-2xl max-w-md text-center border border-white/10 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-black text-white">{t.castNotFound || "Cast Profile Not Available"}</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{error || "Could not retrieve person information from TMDB."}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2 mx-auto"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToBrowse || "Back to Previous Page"}
          </button>
        </div>
      </div>
    );
  }

  const filteredCredits = person.credits.filter((c) => {
    if (activeFilter === "movie") return c.mediaType === "movie";
    if (activeFilter === "tv") return c.mediaType === "tv";
    return true;
  });

  const age = getAge(person.birthday, person.deathday);

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-24" id="cast-detail-page">
      {/* Top sticky navigation bar */}
      <div className="sticky top-0 z-30 bg-[#09090b]/85 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          id="cast-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToBrowse || "Back"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
            TMDB ID: #{person.id}
          </span>
          {person.externalIds?.imdbId && (
            <a
              href={`https://www.imdb.com/name/${person.externalIds.imdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-[#f5c518] text-black text-[11px] font-black flex items-center gap-1 hover:brightness-110"
              title="View on IMDb"
            >
              IMDb
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {person.externalIds?.instagramId && (
            <a
              href={`https://www.instagram.com/${person.externalIds.instagramId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-linear-to-tr from-amber-500 via-rose-500 to-purple-600 text-white text-[11px] font-bold flex items-center gap-1 hover:brightness-110"
              title="Instagram"
            >
              Instagram
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-[#18181b] to-[#09090b] border-b border-white/10">
        <div className="absolute inset-0 bg-radial-at-t from-red-600/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            {/* Portrait Image */}
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="relative w-44 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl shadow-black/80 bg-zinc-900 group">
                {person.profilePath ? (
                  <img
                    src={person.profilePath}
                    alt={person.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-4 text-center">
                    <Clapperboard className="w-12 h-12 mb-2" />
                    <span className="text-xs font-semibold">No Image Available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-white shadow-xs"
                  style={{ backgroundColor: "var(--theme-primary)" }}
                >
                  {person.knownForDepartment || "Acting"}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-white/10 text-zinc-300 border border-white/10 flex items-center gap-1">
                  <Film className="w-3 h-3 text-red-500" />
                  {person.credits.length} {t.creditsCount || "Credits"}
                </span>
                {person.popularity ? (
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    Pop: {person.popularity.toFixed(1)}
                  </span>
                ) : null}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
                {person.name}
              </h1>

              {/* Personal Details Pills */}
              <div className="flex flex-wrap gap-3 text-xs text-zinc-300 pt-1">
                {person.birthday && (
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {person.birthday}
                      {age !== null && (
                        <span className="text-zinc-400 ml-1">
                          ({age} {person.deathday ? "years old at death" : (t.yearsOld || "years old")})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {person.placeOfBirth && (
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate max-w-xs">{person.placeOfBirth}</span>
                  </div>
                )}
              </div>

              {/* Biography */}
              {person.biography ? (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {t.biography || "Biography"}
                  </h3>
                  <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    <p className={bioExpanded ? "" : "line-clamp-4"}>
                      {person.biography}
                    </p>
                    {person.biography.length > 320 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="mt-2 text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {bioExpanded ? (
                          <>
                            {t.showLess || "Show Less"}
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            {t.readMore || "Read Full Biography"}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic pt-2">
                  {t.noBioAvailable || "No detailed biography provided for this cast member on TMDB."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filmography Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-red-500" />
              {t.filmography || "Filmography & Known For"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {t.filmographyDesc || "Movies and television shows featuring this cast member."}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 p-1 rounded-lg">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-white/15 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.all || "All"} ({person.credits.length})
            </button>
            <button
              onClick={() => setActiveFilter("movie")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "movie"
                  ? "bg-white/15 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Film className="w-3 h-3" />
              {t.movies || "Movies"} ({person.credits.filter(c => c.mediaType === "movie").length})
            </button>
            <button
              onClick={() => setActiveFilter("tv")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "tv"
                  ? "bg-white/15 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Tv className="w-3 h-3" />
              {t.tvSeries || "TV Shows"} ({person.credits.filter(c => c.mediaType === "tv").length})
            </button>
          </div>
        </div>

        {/* Credits Grid */}
        {filteredCredits.length === 0 ? (
          <div className="cinema-surface p-12 text-center rounded-2xl border border-white/10">
            <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-semibold">{t.noMatchingTitles || "No titles found in this category."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredCredits.map((credit) => {
              const catalogMatch = findCatalogMatch(credit);

              return (
                <div
                  key={`${credit.mediaType}-${credit.id}`}
                  onClick={() => {
                    if (catalogMatch) {
                      onSelectMovie(catalogMatch);
                    } else {
                      setSelectedPreviewCredit(credit);
                    }
                  }}
                  className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer hover:-translate-y-1.5 shadow-lg ${
                    catalogMatch
                      ? "border-emerald-500/40 bg-zinc-900/90 hover:border-emerald-400 shadow-emerald-950/30"
                      : "border-white/10 bg-zinc-900 hover:border-white/25 shadow-black/60"
                  }`}
                  id={`cast-credit-${credit.id}`}
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                    {credit.posterUrl ? (
                      <img
                        src={credit.posterUrl}
                        alt={credit.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900 p-2 text-center">
                        <Clapperboard className="w-8 h-8" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Streamable on platform badge */}
                    {catalogMatch && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-black shadow-md flex items-center gap-1 animate-pulse">
                          <CheckCircle2 className="w-2.5 h-2.5 fill-black stroke-emerald-500" />
                          Stream Now
                        </span>
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-black/75 text-zinc-300 backdrop-blur-xs border border-white/10">
                        {credit.mediaType === "tv" ? "TV" : "Movie"}
                      </span>
                    </div>

                    {/* Rating badge */}
                    {credit.rating ? (
                      <div className="absolute bottom-2 left-2 flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-black/75 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {credit.rating}
                      </div>
                    ) : null}

                    {/* Year badge */}
                    {credit.releaseYear ? (
                      <div className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-zinc-300 bg-black/75 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {credit.releaseYear}
                      </div>
                    ) : null}

                    {/* Hover play icon trigger */}
                    {catalogMatch && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <span
                          className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform"
                          style={{ backgroundColor: "var(--theme-primary)" }}
                        >
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title and Role info */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {credit.title}
                      </h4>
                      {credit.character && (
                        <p className="text-[10px] text-zinc-400 italic line-clamp-1 mt-0.5">
                          {t?.asRole || "as"} {credit.character}
                        </p>
                      )}
                    </div>

                    {catalogMatch ? (
                      <div className="mt-2 pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-bold text-emerald-400">
                        <span>{t?.inCatalogBadge || "In Catalog"}</span>
                        <span>4K HDR</span>
                      </div>
                    ) : (
                      <div className="mt-2 pt-1.5 border-t border-white/5 text-[9px] text-zinc-500 truncate">
                        TMDB Catalog
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for Titles not yet in MyStreamFlix */}
      {selectedPreviewCredit && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPreviewCredit(null)}>
          <div
            className="cinema-surface p-6 rounded-2xl max-w-md w-full border border-white/10 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <div className="w-20 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                {selectedPreviewCredit.posterUrl && (
                  <img src={selectedPreviewCredit.posterUrl} alt={selectedPreviewCredit.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-white/10 text-zinc-300">
                  {selectedPreviewCredit.mediaType === "tv" ? (t?.tvSeries || "TV Series") : (t?.movies || "Movie")}
                </span>
                <h3 className="text-base font-black text-white mt-1 line-clamp-2">{selectedPreviewCredit.title}</h3>
                {selectedPreviewCredit.character && (
                  <p className="text-xs text-zinc-400 italic mt-0.5">{t?.roleLabel || "Role"}: {selectedPreviewCredit.character}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                  {selectedPreviewCredit.releaseYear && <span>{selectedPreviewCredit.releaseYear}</span>}
                  {selectedPreviewCredit.rating && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {selectedPreviewCredit.rating}/10
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedPreviewCredit.overview && (
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4 bg-white/5 p-3 rounded-lg border border-white/5">
                {selectedPreviewCredit.overview}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-zinc-500">
                {t.titleNotAvailableYet || "Title not currently available in local catalog."}
              </p>
              <button
                onClick={() => setSelectedPreviewCredit(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {t.closeDialog || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
