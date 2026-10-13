const fs = require('fs');

const extraKeys = {
  catNational: { en: "National", id: "Nasional", es: "Nacional" },
  catNews: { en: "News", id: "Berita", es: "Noticias" },
  catEntertainment: { en: "Entertainment", id: "Hiburan", es: "Entretenimiento" },
  catSports: { en: "Sports", id: "Olahraga", es: "Deportes" },
  catDocumentary: { en: "Documentary", id: "Dokumenter", es: "Documental" },
  regAsia: { en: "Asia", id: "Asia", es: "Asia" },
  regEurope: { en: "Europe", id: "Eropa", es: "Europa" },
  regAmericas: { en: "Americas", id: "Amerika", es: "América" },
  regMiddleEast: { en: "Middle East", id: "Timur Tengah", es: "Medio Oriente" },

  gdriveNotYetInDb: { en: "Not in DB", id: "Belum Ada di DB", es: "No en BD" },
  gdriveAlreadyInDb: { en: "Already in DB", id: "Sudah di DB", es: "Ya en BD" },
  gdriveSearchScanPlaceholder: { en: "Search scan results...", id: "Cari hasil scan...", es: "Buscar resultados..." },
  gdriveConnectingScanning: { en: "Connecting to Google Drive & Fetching TMDB Metadata...", id: "Menghubungi Google Drive & Mencari Metadata TMDB...", es: "Conectando a Google Drive y obteniendo metadatos TMDB..." },
  gdriveConnectingDesc: { en: "System is scanning folders, detecting videos, subtitles, and matching posters from TMDB.", id: "Sistem sedang memindai folder, mendeteksi video, subtitle, dan mencocokkan poster dari TMDB.", es: "El sistema está escaneando carpetas, detectando videos, subtítulos y buscando pósters en TMDB." },
  gdriveNoScanYet: { en: "No Scan Results Yet", id: "Belum Ada Hasil Pemindaian", es: "Sin Resultados de Escaneo Aún" },
  gdriveNoScanYetDesc: { en: "Click 'Scan Google Drive' above to scan folders and videos in your Google Drive.", id: "Klik tombol 'Pindai Google Drive' di atas untuk memindai seluruh folder dan file video yang ada di Google Drive Anda.", es: "Haz clic en 'Escanear Google Drive' para escanear carpetas y videos en tu Google Drive." },
  gdriveSelectedReady: { en: "selected of", id: "terpilih dari", es: "seleccionados de" },
  gdriveNewMoviesReady: { en: "new movies ready to import.", id: "film baru yang siap diimpor.", es: "películas nuevas listas para importar." },
  gdriveScanPrompt: { en: "Scan Google Drive folder to automatically detect movies.", id: "Pindai folder Google Drive untuk mendeteksi film otomatis.", es: "Escanea la carpeta de Google Drive para detectar películas automáticamente." },
  gdriveImportingProgress: { en: "Importing", id: "Mengimpor", es: "Importando" },
  gdriveImportToCatalog: { en: "Import to Catalog", id: "Impor ke Katalog", es: "Importar al Catálogo" },

  useSource: { en: "Use Source", id: "Pakai Sumber", es: "Usar Fuente" },
  checkStreamHealth: { en: "Check Stream Health", id: "Cek Health Stream", es: "Verificar Estado de Transmisiones" },
  checkingStream: { en: "Checking Stream...", id: "Cek Stream...", es: "Verificando Transmisión..." },
  bulkImportProcess: { en: "Processing Bulk Channel Import...", id: "Proses Bulk Import Saluran...", es: "Procesando Importación Masiva..." },
  actionsCol: { en: "Action", id: "Aksi", es: "Acción" },
  iptvDynamicSourceTitle: { en: "iptv-org Dynamic Sources:", id: "Sumber Dinamis iptv-org:", es: "Fuentes Dinámicas iptv-org:" },
  iptvPresetSourceTitle: { en: "Trusted Preset Sources (iptv-org):", id: "Sumber Preset Terpercaya (iptv-org):", es: "Fuentes Predefinidas Confiables (iptv-org):" },

  englishLabel: { en: "English (US)", id: "English (US)", es: "English (US)" },
  indonesianLabel: { en: "Bahasa Indonesia", id: "Bahasa Indonesia", es: "Bahasa Indonesia" },
  spanishLabel: { en: "Español (ES)", id: "Español (ES)", es: "Español (ES)" }
};

let content = fs.readFileSync('src/translations.ts', 'utf8');

function formatEntries(lang) {
  const lines = [];
  for (const [k, v] of Object.entries(extraKeys)) {
    const val = v[lang].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`    ${k}: "${val}",`);
  }
  return lines.join('\n');
}

content = content.replace(
  'tapToPlay: "Tap to start live stream",',
  'tapToPlay: "Tap to start live stream",\n' + formatEntries('en')
);

content = content.replace(
  'tapToPlay: "Ketuk untuk memulai siaran langsung",',
  'tapToPlay: "Ketuk untuk memulai siaran langsung",\n' + formatEntries('id')
);

content = content.replace(
  'tapToPlay: "Toca para iniciar la transmisión en vivo"',
  'tapToPlay: "Toca para iniciar la transmisión en vivo",\n' + formatEntries('es')
);

fs.writeFileSync('src/translations.ts', content, 'utf8');
console.log('Added extra keys to all 3 languages in translations.ts!');
