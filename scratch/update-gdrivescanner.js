const fs = require('fs');

let content = fs.readFileSync('src/components/GDriveScanner.tsx', 'utf8');

content = content.replace(
  'data.error || "Gagal memindai folder Google Drive."',
  'data.error || t?.gdriveScanFailed || "Failed to scan Google Drive folder."'
);
content = content.replace(
  'errData.error || "Gagal mengimpor film."',
  'errData.error || t?.gdriveImportFailed || "Failed to import movies."'
);
content = content.replace(
  'err.message || "Gagal mengimpor film ke database."',
  'err.message || t?.gdriveImportFailed || "Failed to import movies into database."'
);
content = content.replace(
  'Semua ({scannedMovies.length})',
  '{t?.all || "All"} ({scannedMovies.length})'
);
content = content.replace(
  'Belum Ada di DB ({totalNew})',
  '{t?.gdriveNotYetInDb || "Not in DB"} ({totalNew})'
);
content = content.replace(
  'Sudah di DB ({scannedMovies.length - totalNew})',
  '{t?.gdriveAlreadyInDb || "Already in DB"} ({scannedMovies.length - totalNew})'
);
content = content.replace(
  'placeholder="Cari hasil scan..."',
  'placeholder={t?.gdriveSearchScanPlaceholder || "Search scan results..."}'
);
content = content.replace(
  'Pilih Semua yang Baru',
  '{t?.gdriveSelectAllNew || "Select All New"}'
);
content = content.replace(
  '<strong>Berhasil Mengimpor!</strong> {importResult.importedCount} film berhasil ditambahkan ke Catalog Database.',
  '<strong>{t?.gdriveSuccessImport || "Successfully Imported!"}</strong> {importResult.importedCount} {t?.movies || "movies"} {t?.availableOnStream || "added to catalog"}.'
);
content = content.replace(
  '<p className="text-sm font-bold text-zinc-300">Menghubungi Google Drive & Mencari Metadata TMDB...</p>',
  '<p className="text-sm font-bold text-zinc-300">{t?.gdriveConnectingScanning || "Connecting to Google Drive & Fetching TMDB Metadata..."}</p>'
);
content = content.replace(
  '<p className="text-xs text-zinc-500 max-w-sm">\n                Sistem sedang memindai folder, mendeteksi video, subtitle, dan mencocokkan poster dari TMDB.\n              </p>',
  '<p className="text-xs text-zinc-500 max-w-sm">{t?.gdriveConnectingDesc || "Scanning folders, detecting videos, subtitles, and matching posters from TMDB."}</p>'
);
content = content.replace(
  '<p className="text-sm font-bold text-zinc-300">Belum Ada Hasil Pemindaian</p>',
  '<p className="text-sm font-bold text-zinc-300">{t?.gdriveNoScanYet || "No Scan Results Yet"}</p>'
);
content = content.replace(
  '<p className="text-xs text-zinc-500 max-w-md">\n                Klik tombol <strong>"Mulai Scan Drive"</strong> di atas untuk memindai seluruh folder dan file video yang ada di Google Drive Anda.\n              </p>',
  '<p className="text-xs text-zinc-500 max-w-md">{t?.gdriveNoScanYetDesc || "Click Scan Google Drive above to scan folders and videos in your Google Drive."}</p>'
);
content = content.replace(
  '<span>\n                Terpilih <strong>{selectedIds.size}</strong> dari <strong>{totalNew}</strong> film baru yang siap diimpor.\n              </span>',
  '<span><strong>{selectedIds.size}</strong> {t?.gdriveSelectedReady || "selected of"} <strong>{totalNew}</strong> {t?.gdriveNewMoviesReady || "new movies ready to import."}</span>'
);
content = content.replace(
  '<span>Pindai folder Google Drive untuk mendeteksi film otomatis.</span>',
  '<span>{t?.gdriveScanPrompt || "Scan Google Drive folder to automatically detect movies."}</span>'
);
content = content.replace(
  '>\n              Tutup\n            </button>',
  '>\n              {t?.close || "Close"}\n            </button>'
);
content = content.replace(
  'Mengimpor ({importProgress?.current || 0}/{importProgress?.total || 0})...',
  '{t?.gdriveImportingProgress || "Importing"} ({importProgress?.current || 0}/{importProgress?.total || 0})...'
);
content = content.replace(
  'Impor {selectedIds.size > 0 ? `(${selectedIds.size})` : ""} ke Catalog',
  '{t?.gdriveImportToCatalog || "Import to Catalog"} {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}'
);

fs.writeFileSync('src/components/GDriveScanner.tsx', content, 'utf8');
console.log('Successfully updated src/components/GDriveScanner.tsx!');
