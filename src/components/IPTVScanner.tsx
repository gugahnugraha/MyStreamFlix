/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IPTVScanner Component
 * Interactive IPTV M3U Playlist scanner for Admin CMS Live TV management.
 * Fetches any public M3U playlist via the /api/iptv-scan server-side proxy (avoids CORS).
 */

import React, { useState, useCallback } from "react";
import {
  Radio, Search, Download, Globe, CheckSquare, Square, AlertCircle,
  Loader2, ExternalLink, Tv2, Filter, ChevronDown, RefreshCw, Check, Zap
} from "lucide-react";

interface ParsedChannel {
  name: string;
  streamUrl: string;
  logo: string;
  group: string;
  country: string;
  language: string;
  tvgId: string;
}

interface IPTVScannerProps {
  brandColor: string;
  onImportChannel: (channel: ParsedChannel) => Promise<void>;
}

const PRESET_SOURCES = [
  {
    label: "iptv-org — Indonesia",
    url: "https://iptv-org.github.io/iptv/countries/id.m3u",
    flag: "🇮🇩",
    description: "All Indonesian TV channels from the official iptv-org curated playlist",
  },
  {
    label: "iptv-org — Japan",
    url: "https://iptv-org.github.io/iptv/countries/jp.m3u",
    flag: "🇯🇵",
    description: "Japanese TV channels from iptv-org",
  },
  {
    label: "iptv-org — Korea",
    url: "https://iptv-org.github.io/iptv/countries/kr.m3u",
    flag: "🇰🇷",
    description: "South Korean TV channels from iptv-org",
  },
  {
    label: "iptv-org — News Global",
    url: "https://iptv-org.github.io/iptv/categories/news.m3u",
    flag: "📰",
    description: "Global news channels — CNN, BBC, Al Jazeera, DW, France 24, and more",
  },
  {
    label: "iptv-org — Sports Global",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    flag: "⚽",
    description: "International sports channels from iptv-org",
  },
  {
    label: "iptv-org — Kids & Family",
    url: "https://iptv-org.github.io/iptv/categories/kids.m3u",
    flag: "🧒",
    description: "Children and family programming channels",
  },
];

export default function IPTVScanner({ brandColor, onImportChannel }: IPTVScannerProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ParsedChannel[]>([]);
  const [scanTotal, setScanTotal] = useState(0);
  const [scanError, setScanError] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [importingChannels, setImportingChannels] = useState<Set<string>>(new Set());
  const [importedChannels, setImportedChannels] = useState<Set<string>>(new Set());
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [filterSearch, setFilterSearch] = useState("");
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = useCallback(async () => {
    if (!sourceUrl.trim()) return;

    setIsScanning(true);
    setScanError("");
    setScanResults([]);
    setSelectedChannels(new Set());
    setImportedChannels(new Set());
    setFilterGroup("ALL");
    setFilterSearch("");

    try {
      const res = await fetch("/api/iptv-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
          limit: 200,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanError(data.error || "Gagal memindai playlist. Coba lagi.");
        return;
      }

      setScanResults(data.channels || []);
      setScanTotal(data.total || 0);
      setAvailableGroups(data.filters?.groups || []);
    } catch {
      setScanError("Koneksi gagal. Periksa koneksi internet Anda.");
    } finally {
      setIsScanning(false);
    }
  }, [sourceUrl]);

  const handleSelectPreset = (url: string) => {
    setSourceUrl(url);
    setScanResults([]);
    setScanError("");
  };

  const toggleSelect = (url: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedChannels.size === filteredResults.length) {
      setSelectedChannels(new Set());
    } else {
      setSelectedChannels(new Set(filteredResults.map(ch => ch.streamUrl)));
    }
  };

  const handleImportSelected = async () => {
    const toImport = filteredResults.filter(ch => selectedChannels.has(ch.streamUrl));
    for (const ch of toImport) {
      setImportingChannels(prev => new Set(prev).add(ch.streamUrl));
      await onImportChannel(ch);
      setImportingChannels(prev => {
        const next = new Set(prev);
        next.delete(ch.streamUrl);
        return next;
      });
      setImportedChannels(prev => new Set(prev).add(ch.streamUrl));
      // Small delay between imports
      await new Promise(r => setTimeout(r, 150));
    }
    setSelectedChannels(new Set());
  };

  // Apply local filters on scan results
  const filteredResults = scanResults.filter(ch => {
    const matchesGroup = filterGroup === "ALL" || ch.group === filterGroup;
    const matchesSearch = !filterSearch ||
      ch.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      ch.country.toLowerCase().includes(filterSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
      {/* Scanner Header */}
      <button
        onClick={() => setShowScanner(!showScanner)}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-900/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: `linear-gradient(135deg, ${brandColor}30, ${brandColor}10)`, border: `1px solid ${brandColor}40` }}>
            <Zap className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              📡 IPTV Scanner & Playlist Importer
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                Dinamis
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Scan playlist M3U dari sumber gratis seperti iptv-org, lalu import saluran ke database secara langsung.
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${showScanner ? "rotate-180" : ""}`} />
      </button>

      {showScanner && (
        <div className="border-t border-zinc-900 p-5 space-y-5">

          {/* Preset Source Buttons */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Sumber Preset Terpercaya (iptv-org):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PRESET_SOURCES.map((source) => (
                <button
                  key={source.url}
                  onClick={() => handleSelectPreset(source.url)}
                  className={`flex items-start gap-2 p-3 rounded-xl text-left text-xs border transition-all cursor-pointer ${
                    sourceUrl === source.url
                      ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-zinc-300 hover:text-white"
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{source.flag}</span>
                  <div className="min-w-0">
                    <span className="font-bold block truncate">{source.label}</span>
                    <span className="text-[10px] text-zinc-500 leading-snug line-clamp-2">{source.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL Input */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Atau masukkan URL M3U Custom:</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://example.com/playlist.m3u"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-all font-mono"
                />
              </div>
              <button
                onClick={handleScan}
                disabled={isScanning || !sourceUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: brandColor, boxShadow: `0 0 12px ${brandColor}30` }}
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
                {isScanning ? "Memindai..." : "Scan Playlist"}
              </button>
            </div>
          </div>

          {/* Scan Error */}
          {scanError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {scanError}
            </div>
          )}

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <div className="space-y-3">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">
                    Ditemukan <span className="text-emerald-400">{filteredResults.length}</span> saluran
                    {scanTotal > scanResults.length && (
                      <span className="text-zinc-500"> (dari total {scanTotal.toLocaleString()})</span>
                    )}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Pilih saluran yang ingin diimport ke database aplikasi
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {selectedChannels.size === filteredResults.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    Pilih Semua ({filteredResults.length})
                  </button>

                  {selectedChannels.size > 0 && (
                    <button
                      onClick={handleImportSelected}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-lg transition-all cursor-pointer"
                      style={{ backgroundColor: "#16a34a", boxShadow: "0 0 10px rgba(22,163,74,0.3)" }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Import {selectedChannels.size} Saluran
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filter nama channel..."
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                {availableGroups.length > 0 && (
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={filterGroup}
                      onChange={e => setFilterGroup(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer"
                    >
                      <option value="ALL">Semua Kategori</option>
                      {availableGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Channel Result List */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {filteredResults.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs">Tidak ada saluran yang sesuai filter</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
                      <tr className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3 w-8"></th>
                        <th className="py-2.5 px-3 text-left">Saluran</th>
                        <th className="py-2.5 px-3 text-left hidden sm:table-cell">Kategori</th>
                        <th className="py-2.5 px-3 text-left hidden md:table-cell">Negara</th>
                        <th className="py-2.5 px-3 text-right w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredResults.map((ch) => {
                        const isSelected = selectedChannels.has(ch.streamUrl);
                        const isImporting = importingChannels.has(ch.streamUrl);
                        const isImported = importedChannels.has(ch.streamUrl);

                        return (
                          <tr
                            key={ch.streamUrl}
                            onClick={() => !isImported && toggleSelect(ch.streamUrl)}
                            className={`transition-colors cursor-pointer ${
                              isSelected ? "bg-emerald-950/20" : "hover:bg-zinc-900/60"
                            } ${isImported ? "opacity-60" : ""}`}
                          >
                            <td className="py-2.5 px-3">
                              {isImported ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : isImporting ? (
                                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                              ) : isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-zinc-600" />
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                {ch.logo ? (
                                  <img src={ch.logo} alt={ch.name} className="w-7 h-7 rounded object-contain bg-zinc-900 border border-zinc-800 shrink-0 p-0.5" />
                                ) : (
                                  <Tv2 className="w-5 h-5 text-zinc-600 shrink-0" />
                                )}
                                <span className="font-semibold text-white truncate max-w-[150px]">{ch.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 hidden sm:table-cell">
                              <span className="text-zinc-400 truncate">{ch.group || "—"}</span>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell">
                              <span className="text-zinc-500 text-[10px] uppercase font-bold">{ch.country || "—"}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <a
                                href={ch.streamUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors inline-flex"
                                title="Buka URL Stream"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
