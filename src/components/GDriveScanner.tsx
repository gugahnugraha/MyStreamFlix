/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GDriveScanner Component
 * Scans Google Drive folders for movies & video files, matches them with TMDB metadata,
 * and bulk imports them directly into the MyStreamFlix catalog database.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  FolderSearch, Download, CheckSquare, Square, AlertCircle,
  Loader2, ExternalLink, Film, Check, RefreshCw, Sparkles,
  Info, Database, ShieldCheck, Layers, Eye
} from "lucide-react";
import { Movie } from "../types";

interface ScannedMovie {
  id: string;
  folderId?: string;
  fileId?: string;
  rawName: string;
  title: string;
  releaseYear: number;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  duration: number;
  rating: number;
  ageRating: string;
  quality: string;
  genres: string[];
  cast: string[];
  directors: string[];
  country: string;
  language: string;
  contentType: "movie" | "series";
  subtitles: { id: string; language: string; label: string; fileUrl: string }[];
  alreadyInDb: boolean;
  tmdbMatched: boolean;
}

interface GDriveScannerProps {
  brandColor: string;
  onClose: () => void;
  onRefreshMovies: () => void;
  t: any;
}

export default function GDriveScanner({
  brandColor = "#00ADB5",
  onClose,
  onRefreshMovies,
  t
}: GDriveScannerProps) {
  const [folderIdInput, setFolderIdInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedMovies, setScannedMovies] = useState<ScannedMovie[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<"all" | "new" | "imported">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ importedCount: number; skippedCount: number } | null>(null);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setImportResult(null);
    setSelectedIds(new Set());

    try {
      const url = folderIdInput.trim()
        ? `/api/gdrive/scan?folderId=${encodeURIComponent(folderIdInput.trim())}`
        : "/api/gdrive/scan";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memindai folder Google Drive.");
      }

      setScannedMovies(data.movies || []);

      // Auto-select all new movies that are not yet in database
      const newIds = new Set<string>();
      (data.movies || []).forEach((m: ScannedMovie) => {
        if (!m.alreadyInDb) newIds.add(m.id);
      });
      setSelectedIds(newIds);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memindai Google Drive.");
    } finally {
      setScanning(false);
    }
  }, [folderIdInput]);

  const filteredMovies = useMemo(() => {
    return scannedMovies.filter((movie) => {
      if (filterType === "new" && movie.alreadyInDb) return false;
      if (filterType === "imported" && !movie.alreadyInDb) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = movie.title.toLowerCase().includes(q);
        const matchRaw = movie.rawName.toLowerCase().includes(q);
        if (!matchTitle && !matchRaw) return false;
      }
      return true;
    });
  }, [scannedMovies, filterType, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleNewIds = filteredMovies.filter((m) => !m.alreadyInDb).map((m) => m.id);
    const allSelected = visibleNewIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleNewIds.forEach((id) => next.delete(id));
      } else {
        visibleNewIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleImportSelected = async () => {
    const moviesToImport = scannedMovies.filter((m) => selectedIds.has(m.id));
    if (moviesToImport.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: moviesToImport.length });

    try {
      const payload = moviesToImport.map((m) => ({
        title: m.title,
        description: m.description,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        videoUrl: m.videoUrl,
        duration: m.duration,
        releaseYear: m.releaseYear,
        rating: m.rating,
        ageRating: m.ageRating,
        quality: m.quality,
        genres: m.genres,
        cast: m.cast,
        directors: m.directors,
        country: m.country,
        language: m.language,
        contentType: m.contentType,
        subtitles: m.subtitles,
        isFeatured: false,
        isBanner: false,
      }));

      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengimpor film.");
      }

      const resultData = await res.json();
      setImportResult({
        importedCount: resultData.importedCount || moviesToImport.length,
        skippedCount: resultData.skippedCount || 0,
      });

      // Mark imported in local state
      setScannedMovies((prev) =>
        prev.map((m) => (selectedIds.has(m.id) ? { ...m, alreadyInDb: true } : m))
      );
      setSelectedIds(new Set());
      onRefreshMovies();
    } catch (err: any) {
      setError(err.message || "Gagal mengimpor film ke database.");
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const totalNew = scannedMovies.filter((m) => !m.alreadyInDb).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Google Drive Scanner & Importer
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Auto-TMDB
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pindai folder Google Drive, ekstrak judul & subtitle otomatis, dan impor langsung ke Catalog.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scan Bar & Controls */}
        <div className="p-4 bg-zinc-900/30 border-b border-zinc-850 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Folder ID Google Drive (kosongkan untuk memakai GOOGLE_DRIVE_FOLDER_ID dari .env)..."
                value={folderIdInput}
                onChange={(e) => setFolderIdInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500/50 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memindai Drive & TMDB...
                </>
              ) : (
                <>
                  <FolderSearch className="w-4 h-4" />
                  Mulai Scan Drive
                </>
              )}
            </button>
          </div>

          {/* Results bar & Filters */}
          {scannedMovies.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    filterType === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Semua ({scannedMovies.length})
                </button>
                <button
                  onClick={() => setFilterType("new")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    filterType === "new" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Belum Ada di DB ({totalNew})
                </button>
                <button
                  onClick={() => setFilterType("imported")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    filterType === "imported" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sudah di DB ({scannedMovies.length - totalNew})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari hasil scan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-hidden w-40 sm:w-48"
                />
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                >
                  Pilih Semua yang Baru
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 flex items-start gap-3 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Import Success Alert */}
        {importResult && (
          <div className="m-4 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Berhasil Mengimpor!</strong> {importResult.importedCount} film berhasil ditambahkan ke Catalog Database.
              </span>
            </div>
            <button onClick={() => setImportResult(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[260px]">
          {scanning ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm font-bold text-zinc-300">Menghubungi Google Drive & Mencari Metadata TMDB...</p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Sistem sedang memindai folder, mendeteksi video, subtitle, dan mencocokkan poster dari TMDB.
              </p>
            </div>
          ) : scannedMovies.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                <FolderSearch className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-zinc-300">Belum Ada Hasil Pemindaian</p>
              <p className="text-xs text-zinc-500 max-w-md">
                Klik tombol <strong>"Mulai Scan Drive"</strong> di atas untuk memindai seluruh folder dan file video yang ada di Google Drive Anda.
              </p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-zinc-500">
              Tidak ada film yang cocok dengan filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMovies.map((movie) => {
                const isSelected = selectedIds.has(movie.id);

                return (
                  <div
                    key={movie.id}
                    onClick={() => !movie.alreadyInDb && toggleSelect(movie.id)}
                    className={`relative p-3 rounded-xl border transition-all flex gap-3 select-none ${
                      movie.alreadyInDb
                        ? "bg-zinc-950/60 border-zinc-900 opacity-60 cursor-default"
                        : isSelected
                        ? "bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/5 cursor-pointer"
                        : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-700 cursor-pointer"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      {movie.alreadyInDb ? (
                        <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(movie.id)}
                          className="w-4 h-4 rounded border-zinc-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>

                    {/* Poster Preview */}
                    <div className="w-16 sm:w-20 aspect-[2/3] rounded-lg bg-zinc-950 overflow-hidden border border-zinc-800 shrink-0">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {movie.title}
                          </h4>
                          {movie.alreadyInDb && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                              Di Database
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate" title={movie.rawName}>
                          📁 {movie.rawName}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                            {movie.releaseYear}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            ★ {movie.rating}
                          </span>
                          {movie.tmdbMatched && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ✓ TMDB
                            </span>
                          )}
                          {movie.subtitles.length > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              💬 {movie.subtitles.length} Subtitle
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-500 line-clamp-1 mt-2">
                        {movie.genres.join(", ") || "No Genre"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            {scannedMovies.length > 0 ? (
              <span>
                Terpilih <strong>{selectedIds.size}</strong> dari <strong>{totalNew}</strong> film baru yang siap diimpor.
              </span>
            ) : (
              <span>Pindai folder Google Drive untuk mendeteksi film otomatis.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={importing || selectedIds.size === 0}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengimpor ({importProgress?.current || 0}/{importProgress?.total || 0})...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Impor {selectedIds.size > 0 ? `(${selectedIds.size})` : ""} ke Catalog
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
