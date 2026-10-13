const fs = require('fs');

let content = fs.readFileSync('src/components/IPTVScanner.tsx', 'utf8');

// Update props
content = content.replace(
  'interface IPTVScannerProps {\n  brandColor: string;\n  onImportChannel: (channel: ParsedChannel) => Promise<void>;\n  onImportChannelsBulk?: (channels: ParsedChannel[]) => Promise<{ importedCount: number; skippedCount: number }>;\n}',
  'interface IPTVScannerProps {\n  brandColor: string;\n  onImportChannel: (channel: ParsedChannel) => Promise<void>;\n  onImportChannelsBulk?: (channels: ParsedChannel[]) => Promise<{ importedCount: number; skippedCount: number }>;\n  t?: any;\n}'
);

content = content.replace(
  'export default function IPTVScanner({ brandColor, onImportChannel, onImportChannelsBulk }: IPTVScannerProps) {',
  'export default function IPTVScanner({ brandColor, onImportChannel, onImportChannelsBulk, t }: IPTVScannerProps) {'
);

// Errors
content = content.replace(
  'data.error || "Gagal memindai playlist. Coba lagi."',
  'data.error || t?.iptvScanFailed || "Failed to scan playlist. Please try again."'
);
content = content.replace(
  'setScanError("Koneksi gagal. Periksa koneksi internet Anda.");',
  'setScanError(t?.iptvNetworkError || "Connection failed. Please check your internet connection.");'
);

// Header texts
content = content.replace(
  'Scan playlist M3U dari sumber gratis seperti iptv-org, lalu import saluran ke database secara langsung.',
  '{t?.iptvDesc || "Scan public M3U playlists from sources like iptv-org and directly import channels to your database."}'
);
content = content.replace(
  '<p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Sumber Dinamis iptv-org:</p>',
  '<p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{t?.iptvDynamicSourceTitle || "iptv-org Dynamic Sources:"}</p>'
);
content = content.replace(
  '<option value="country" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>Negara</option>',
  '<option value="country" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>{t?.country || "Country"}</option>'
);
content = content.replace(
  '<option value="category" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>Kategori</option>',
  '<option value="category" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>{t?.genres || "Category"}</option>'
);
content = content.replace(
  'Pakai Sumber',
  '{t?.useSource || "Use Source"}'
);
content = content.replace(
  '<p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Sumber Preset Terpercaya (iptv-org):</p>',
  '<p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{t?.iptvPresetSourceTitle || "Trusted Preset Sources (iptv-org):"}</p>'
);

// Scan results
content = content.replace(
  'Pilih saluran yang ingin diimport ke database aplikasi',
  '{t?.iptvSelectImportDesc || "Select the channels you wish to import into the catalog database."}'
);
content = content.replace(
  '{isCheckingPreImportHealth ? "Cek Stream..." : "Cek Health Stream"}',
  '{isCheckingPreImportHealth ? (t?.checkingStream || "Checking Stream...") : (t?.checkStreamHealth || "Check Stream Health")}'
);
content = content.replace(
  'Pilih Stream Online Only',
  '{t?.iptvSelectOnlineOnly || "Select Online Streams Only"}'
);
content = content.replace(
  'Pilih Semua ({filteredResults.length})',
  '{t?.iptvSelectAll || "Select All"} ({filteredResults.length})'
);
content = content.replace(
  '{isImportingBulk ? "Mengimport..." : `Import ${selectedChannels.size} Saluran`}',
  '{isImportingBulk ? (t?.gdriveImportingProgress || "Importing...") : `${t?.iptvImportSelected || "Import Channels"} (${selectedChannels.size})`}'
);
content = content.replace(
  'Proses Bulk Import Saluran...',
  '{t?.bulkImportProcess || "Processing Bulk Channel Import..."}'
);
content = content.replace(
  'placeholder="Filter nama channel..."',
  'placeholder={t?.iptvFilterPlaceholder || "Filter channel name..."}'
);
content = content.replace(
  '<option value="ALL" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>Semua Kategori</option>',
  '<option value="ALL" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>{t?.iptvAllCategories || "All Categories"}</option>'
);
content = content.replace(
  '<option value="ALL" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>Semua Negara</option>',
  '<option value="ALL" className="bg-zinc-950 text-white py-1.5" style={{ backgroundColor: \'#09090b\', color: \'#f4f4f5\' }}>{t?.iptvAllCountries || "All Countries"}</option>'
);
content = content.replace(
  '<div className="py-8 text-center text-zinc-500 text-xs">Tidak ada saluran yang sesuai filter</div>',
  '<div className="py-8 text-center text-zinc-500 text-xs">{t?.iptvNoMatch || "No channels match the current filter."}</div>'
);
content = content.replace(
  '<th className="py-2.5 px-3 text-left">Saluran</th>',
  '<th className="py-2.5 px-3 text-left">{t?.iptvChannelCol || "Channel"}</th>'
);
content = content.replace(
  '<th className="py-2.5 px-3 text-left hidden sm:table-cell">Kategori</th>',
  '<th className="py-2.5 px-3 text-left hidden sm:table-cell">{t?.iptvCategoryCol || "Category"}</th>'
);
content = content.replace(
  '<th className="py-2.5 px-3 text-left hidden md:table-cell">Negara</th>',
  '<th className="py-2.5 px-3 text-left hidden md:table-cell">{t?.iptvCountryCol || "Country"}</th>'
);
content = content.replace(
  '<th className="py-2.5 px-3 text-right w-16">Aksi</th>',
  '<th className="py-2.5 px-3 text-right w-16">{t?.actionsCol || "Action"}</th>'
);

fs.writeFileSync('src/components/IPTVScanner.tsx', content, 'utf8');
console.log('Successfully updated src/components/IPTVScanner.tsx!');
