const fs = require('fs');

const newTranslations = {
  // Navigation & Global
  all: { en: "All", id: "Semua", es: "Todos" },
  home: { en: "Home", id: "Beranda", es: "Inicio" },
  menu: { en: "Menu", id: "Menu", es: "Menú" },
  cancel: { en: "Cancel", id: "Batal", es: "Cancelar" },
  save: { en: "Save", id: "Simpan", es: "Guardar" },
  delete: { en: "Delete", id: "Hapus", es: "Eliminar" },
  edit: { en: "Edit", id: "Ubah", es: "Editar" },
  close: { en: "Close", id: "Tutup", es: "Cerrar" },
  languageSelect: { en: "Language", id: "Bahasa", es: "Idioma" },

  // Footer
  footerBrandDesc: {
    en: "Your premier streaming destination for high-definition blockbuster movies, trending TV series, and live television broadcasts worldwide.",
    id: "Destinasi streaming terdepan Anda untuk film blockbuster definisi tinggi, serial TV populer, dan siaran langsung televisi seluruh dunia.",
    es: "Tu destino de streaming de primer nivel para películas taquilleras en alta definición, series populares y transmisiones de televisión en vivo de todo el mundo."
  },
  explore: { en: "Explore", id: "Jelajahi", es: "Explorar" },
  supportServices: { en: "Support & Help", id: "Bantuan & Layanan", es: "Soporte y Ayuda" },
  corporateLegal: { en: "Corporate & Legal", id: "Korporat & Hukum", es: "Corporativo y Legal" },

  // AuthModal
  loginFailed: { en: "Login failed. Please verify your credentials.", id: "Gagal masuk. Periksa kembali email dan kata sandi Anda.", es: "Error al iniciar sesión. Verifica tus credenciales." },
  nameRequired: { en: "Full name is required.", id: "Nama lengkap wajib diisi.", es: "El nombre completo es obligatorio." },
  registrationFailed: { en: "Registration failed.", id: "Pendaftaran gagal.", es: "Error en el registro." },
  enterEmail: { en: "Please enter your registered email address.", id: "Silakan masukkan alamat email terdaftar Anda.", es: "Por favor, introduce tu correo electrónico registrado." },
  recoverySent: { en: "A password recovery link has been dispatched to your email mailbox!", id: "Tautan pemulihan kata sandi telah dikirim ke email Anda!", es: "¡Se ha enviado un enlace de recuperación de contraseña a tu correo electrónico!" },
  authError: { en: "An authentication error occurred.", id: "Terjadi kesalahan autentikasi.", es: "Ocurrió un error de autenticación." },
  recoverPasscode: { en: "Recover Password", id: "Pulihkan Kata Sandi", es: "Recuperar Contraseña" },
  forgotDesc: { en: "Submit your email address to receive password reset instructions.", id: "Masukkan email Anda untuk menerima instruksi pengaturan ulang kata sandi.", es: "Introduce tu correo para recibir instrucciones de restablecimiento de contraseña." },
  forgotPasscode: { en: "Forgot Password?", id: "Lupa Kata Sandi?", es: "¿Olvidaste tu contraseña?" },
  dispatchRecoverLink: { en: "Send Recovery Link", id: "Kirim Tautan Pemulihan", es: "Enviar Enlace de Recuperación" },
  backToSignIn: { en: "Back to Sign In", id: "Kembali ke Masuk", es: "Volver a Iniciar Sesión" },

  // SubscriptionModal
  choosePlan: { en: "Choose Your Subscription Plan", id: "Pilih Paket Langganan Anda", es: "Elige tu Plan de Suscripción" },
  flexibleSubscription: { en: "Enjoy unlimited 4K streaming, ad-free viewing, and multi-device access with no commitments.", id: "Nikmati streaming 4K tanpa batas, tanpa iklan, dan akses multi-perangkat tanpa komitmen.", es: "Disfruta de streaming 4K ilimitado, sin anuncios y acceso en múltiples dispositivos sin compromisos." },
  selectedPlan: { en: "Selected Plan", id: "Paket Terpilih", es: "Plan Seleccionado" },
  secureSSL: { en: "256-Bit SSL Encrypted & Secure Checkout", id: "Pembayaran Aman & Terenkripsi SSL 256-Bit", es: "Pago Seguro y Encriptado con SSL de 256 Bits" },
  subscriptionTier: { en: "Subscription Tier", id: "Tingkat Langganan", es: "Nivel de Suscripción" },
  billingPeriod: { en: "Billing Period", id: "Periode Penagihan", es: "Período de Facturación" },
  monthlyRenewal: { en: "Renews monthly automatically. Cancel anytime.", id: "Diperpanjang otomatis setiap bulan. Batalkan kapan saja.", es: "Se renueva mensualmente de forma automática. Cancela en cualquier momento." },
  interactiveScreens: { en: "Concurrent Screens", id: "Layar Bersamaan", es: "Pantallas Simultáneas" },

  // ProfileModal
  selectProfileDesc: { en: "Select an active profile or manage family accounts.", id: "Pilih profil aktif atau kelola akun keluarga Anda.", es: "Selecciona un perfil activo o administra las cuentas familiares." },
  selectAvatar: { en: "Choose an Avatar", id: "Pilih Avatar", es: "Elige un Avatar" },
  profileLabel: { en: "Profile Information", id: "Informasi Profil", es: "Información del Perfil" },
  confirmDeleteProfileTitle: { en: "Delete Profile", id: "Hapus Profil", es: "Eliminar Perfil" },
  confirmDeleteProfile: { en: "Are you sure you want to delete this profile? All personalized watchlists will be permanently removed.", id: "Apakah Anda yakin ingin menghapus profil ini? Semua daftar tontonan yang dipersonalisasi akan dihapus permanen.", es: "¿Estás seguro de que deseas eliminar este perfil? Todas las listas de reproducción personalizadas se eliminarán permanentemente." },
  failedDeleteProfile: { en: "Failed to delete profile.", id: "Gagal menghapus profil.", es: "Error al eliminar el perfil." },
  netErrorDeleteProfile: { en: "Network error while deleting profile.", id: "Kesalahan jaringan saat menghapus profil.", es: "Error de red al eliminar el perfil." },
  passwordChangeInstruction: { en: "Provide your current password to authorize setting a new password.", id: "Masukkan kata sandi Anda saat ini untuk mengotorisasi perubahan kata sandi baru.", es: "Introduce tu contraseña actual para autorizar el cambio a una nueva contraseña." },

  // CastDetailView
  roleLabel: { en: "Role", id: "Peran", es: "Papel" },
  asRole: { en: "as", id: "sebagai", es: "como" },
  inCatalogBadge: { en: "In Catalog", id: "Ada di Katalog", es: "En Catálogo" },

  // MovieDetailModal
  watchTrailer: { en: "Watch Trailer", id: "Tonton Trailer", es: "Ver Tráiler" },

  // MediaPlayer & Live Stream Errors
  playNow: { en: "Play Now", id: "Putar Sekarang", es: "Reproducir Ahora" },
  subtitleSettings: { en: "Subtitle Settings", id: "Pengaturan Subtitle", es: "Configuración de Subtítulos" },
  drmErrorTitle: { en: "DRM ENCRYPTED STREAM", id: "SIARAN TERENKRIPSI (DRM)", es: "TRANSMISIÓN CIFRADA (DRM)" },
  drmErrorDesc: {
    en: "This broadcast is protected by DRM (Widevine/PlayReady). Public web players cannot decrypt this stream without official license keys.",
    id: "Siaran ini dilindungi oleh DRM (Widevine/PlayReady). Pemutar web publik tidak dapat memutar siaran terenkripsi tanpa kunci lisensi resmi.",
    es: "Esta transmisión está protegida por DRM (Widevine/PlayReady). Los reproductores web públicos no pueden descifrar esta transmisión sin claves de licencia oficiales."
  },
  dashErrorDesc: {
    en: "Failed to play DASH broadcast. Ensure the channel is online and permits cross-origin playback.",
    id: "Gagal memutar siaran DASH. Pastikan saluran aktif dan mengizinkan pemutaran.",
    es: "Error al reproducir la transmisión DASH. Asegúrate de que el canal esté activo y permita la reproducción."
  },
  streamFailedTitle: { en: "FAILED TO PLAY STREAM", id: "GAGAL MEMUTAR SIARAN", es: "ERROR AL REPRODUCIR TRANSMISIÓN" },
  streamFailedDesc: {
    en: "Cannot connect to the live broadcast. Please check your network connection or select another channel.",
    id: "Tidak dapat menghubungkan ke siaran langsung. Silakan periksa koneksi internet Anda atau pilih saluran lain.",
    es: "No se puede conectar a la transmisión en vivo. Verifica tu conexión de red o selecciona otro canal."
  },

  // LiveTvPage
  allRegions: { en: "All Regions", id: "Semua Wilayah", es: "Todas las Regiones" },
  internationalRegion: { en: "International", id: "Mancanegara", es: "Internacional" },
  indonesiaRegion: { en: "Indonesia", id: "Indonesia", es: "Indonesia" },
  clearSearch: { en: "Clear search", id: "Hapus pencarian", es: "Borrar búsqueda" },
  channelCategories: { en: "Channel Categories:", id: "Kategori Saluran:", es: "Categorías de Canales:" },
  countryRegion: { en: "Country / Region:", id: "Negara / Wilayah:", es: "País / Región:" },
  resetChannelFilter: { en: "Reset channel filters", id: "Reset filter saluran", es: "Restablecer filtros de canales" },
  resetAllFilters: { en: "Reset All Filters", id: "Reset Semua Filter", es: "Restablecer Todos los Filtros" },
  noChannelsInCategory: { en: "No channels available in this category", id: "Tidak ada saluran di kategori ini", es: "No hay canales disponibles en esta categoría" },
  fullscreenChannels: { en: "Channels List (Fullscreen)", id: "Daftar Saluran (Layar Penuh)", es: "Lista de Canales (Pantalla Completa)" },
  prevChannelTooltip: { en: "Previous Channel", id: "Saluran Sebelumnya", es: "Canal Anterior" },
  nextChannelTooltip: { en: "Next Channel", id: "Saluran Berikutnya", es: "Canal Siguiente" },
  playPauseTooltip: { en: "Play / Pause", id: "Putar / Jeda", es: "Reproducir / Pausar" },
  muteUnmuteTooltip: { en: "Mute / Unmute", id: "Bisukan / Bunyikan Suara", es: "Silenciar / Activar Sonido" },
  fullscreenTooltip: { en: "Fullscreen Mode", id: "Mode Layar Penuh", es: "Modo Pantalla Completa" },

  // AdminCMS (Live TV & Scanners & Subtitles)
  cmsLiveTvManagement: { en: "Live TV Channels Management", id: "Manajemen Saluran Live TV", es: "Gestión de Canales de TV en Vivo" },
  cmsLiveTvSubtitle: { en: "Manage HLS, DASH, and M3U8 broadcast streams in your platform catalog.", id: "Kelola siaran streaming HLS, DASH, dan M3U8 dalam katalog platform Anda.", es: "Gestiona transmisiones HLS, DASH y M3U8 en el catálogo de tu plataforma." },
  cmsScanIptvBtn: { en: "Scan IPTV Playlist", id: "Scan Playlist IPTV", es: "Escanear Lista IPTV" },
  cmsAddNewChannelBtn: { en: "+ Add New TV Channel", id: "+ Tambah Channel TV Baru", es: "+ Añadir Nuevo Canal de TV" },
  cmsCheckHealthBtn: { en: "Check All Streams Health", id: "Cek Semua Status Stream", es: "Verificar Estado de Transmisiones" },
  cmsRemoveOfflineBtn: { en: "Remove Offline Channels", id: "Hapus Saluran Offline", es: "Eliminar Canales Desconectados" },
  cmsCorsSettingsTitle: { en: "CORS Proxy & Live TV Whitelist Settings", id: "Pengaturan Proxy CORS & Whitelist Domain Live TV", es: "Configuración de Proxy CORS y Lista Blanca de TV en Vivo" },
  cmsCorsSettingsDesc: { en: "Add new HLS/DASH streaming domains to the serverless CORS proxy bypass list.", id: "Tambahkan domain streaming HLS/DASH baru ke daftar proxy CORS serverless.", es: "Agrega nuevos dominios de streaming HLS/DASH a la lista de omisión de proxy CORS sin servidor." },
  cmsAddDomainPlaceholder: { en: "Enter domain name (e.g. visionplus.id, cnnindonesia.com)...", id: "Masukkan nama domain (contoh: visionplus.id, cnnindonesia.com)...", es: "Introduce el nombre del dominio (ej. visionplus.id, cnnindonesia.com)..." },
  cmsAddDomainBtn: { en: "Add Domain", id: "Tambah Domain", es: "Añadir Dominio" },
  cmsResetDefaultDomains: { en: "Reset to Defaults", id: "Pengaturan Default", es: "Restablecer Valores Predeterminados" },
  cmsSelectedChannels: { en: "channels selected", id: "saluran dipilih", es: "canales seleccionados" },
  cmsDeselectAll: { en: "Deselect", id: "Batal Pilih", es: "Deseleccionar" },
  cmsDeleteSelectedConfirm: { en: "Delete the selected channels? This action cannot be undone.", id: "Hapus saluran yang dipilih? Tindakan ini tidak bisa dibatalkan.", es: "¿Eliminar los canales seleccionados? Esta acción no se puede deshacer." },
  cmsSelectAllChannels: { en: "Select all channels", id: "Pilih semua saluran", es: "Seleccionar todos los canales" },
  cmsChannelStreamUrl: { en: "Stream URL (HLS/DASH)", id: "URL Stream (HLS/DASH)", es: "URL de Transmisión (HLS/DASH)" },
  cmsStreamFormat: { en: "Format", id: "Format", es: "Formato" },
  cmsStreamStatus: { en: "Status", id: "Status", es: "Estado" },
  cmsStreamOnline: { en: "Online", id: "Online", es: "En Línea" },
  cmsStreamOffline: { en: "Offline", id: "Offline", es: "Desconectado" },
  cmsStreamChecking: { en: "Checking...", id: "Memeriksa...", es: "Verificando..." },
  cmsStreamError: { en: "Error", id: "Gagal", es: "Error" },
  cmsStreamNotChecked: { en: "Not checked", id: "Belum dicek", es: "No comprobado" },
  cmsTestPlay: { en: "Test Stream Play", id: "Uji Putar Siaran", es: "Probar Reproducción" },
  cmsEditChannel: { en: "Edit Channel", id: "Edit Saluran", es: "Editar Canal" },
  cmsDeleteChannel: { en: "Delete Channel", id: "Hapus Saluran", es: "Eliminar Saluran" },
  cmsModalAddChannel: { en: "+ Add New TV Channel", id: "+ Tambah Channel TV Baru", es: "+ Añadir Nuevo Canal de TV" },
  cmsModalEditChannel: { en: "Edit TV Channel", id: "Edit Channel TV", es: "Editar Canal de TV" },
  cmsChannelNameLabel: { en: "Channel Name", id: "Nama Channel", es: "Nombre del Canal" },
  cmsChannelUrlLabel: { en: "Stream URL (M3U8 / DASH / MP4)", id: "Stream URL (M3U8 / DASH / MP4)", es: "URL de Transmisión (M3U8 / DASH / MP4)" },
  cmsChannelLogoLabel: { en: "Logo / Thumbnail URL", id: "URL Logo / Thumbnail", es: "URL del Logotipo / Miniatura" },
  cmsChannelDescLabel: { en: "Description", id: "Deskripsi", es: "Descripción" },
  cmsChannelCountryLabel: { en: "Country", id: "Negara", es: "País" },
  cmsChannelLangLabel: { en: "Language", id: "Bahasa", es: "Idioma" },
  cmsChannelQualityLabel: { en: "Stream Quality", id: "Kualitas Stream", es: "Calidad de Transmisión" },
  cmsChannelCategoryLabel: { en: "Channel Category", id: "Kategori Channel", es: "Categoría del Canal" },
  cmsChannelCategoryMin: { en: "Select at least 1 category", id: "Pilih minimal 1 kategori", es: "Selecciona al menos 1 categoría" },
  cmsSaveChannelBtn: { en: "Save Channel", id: "Simpan Channel", es: "Guardar Canal" },
  cmsUpdateChannelBtn: { en: "Update Channel", id: "Update Channel", es: "Actualizar Canal" },
  cmsSavingChannel: { en: "Saving...", id: "Menyimpan...", es: "Guardando..." },
  cmsChannelSuccessCreate: { en: "Channel successfully added! ✅", id: "Channel berhasil ditambahkan! ✅", es: "¡Canal añadido con éxito! ✅" },
  cmsChannelSuccessUpdate: { en: "Channel successfully updated! ✅", id: "Channel berhasil diperbarui! ✅", es: "¡Canal actualizado con éxito! ✅" },
  cmsChannelNameUrlRequired: { en: "Channel name and stream URL are required.", id: "Nama channel dan stream URL wajib diisi.", es: "El nombre del canal y la URL de transmisión son obligatorios." },
  cmsChannelSaveFailed: { en: "Failed to save channel.", id: "Gagal menyimpan channel.", es: "Error al guardar el canal." },
  cmsAutoFetchSubs: { en: "Auto-fetch Subs", id: "Cari Subtitle Otomatis", es: "Auto-buscar Subtítulos" },
  cmsAutoSubsSuccess: { en: "Successfully added subtitles (Priorities: Indonesian & English)! ✨", id: "Berhasil menambahkan subtitle (Prioritas: Indonesia & English)! ✨", es: "¡Subtítulos añadidos con éxito (Prioridad: Indonesio e Inglés)! ✨" },
  cmsAutoSubsAlreadyExist: { en: "Subtitles for the detected languages already exist in the list.", id: "Subtitle untuk bahasa yang ditemukan sudah ada di daftar.", es: "Los subtítulos para los idiomas detectados ya existen en la lista." },
  cmsAutoSubsFailed: { en: "Failed to search subtitles automatically.", id: "Gagal mencari subtitle otomatis.", es: "Error al buscar subtítulos automáticamente." },
  cmsChangeVideo: { en: "Change Video URL", id: "Ganti URL Video", es: "Cambiar URL de Video" },

  // IPTVScanner
  iptvTitle: { en: "IPTV M3U Playlist Scanner", id: "Pemindai Playlist IPTV M3U", es: "Escáner de Listas de Reproducción IPTV M3U" },
  iptvDesc: { en: "Scan public M3U playlists from sources like iptv-org and directly import channels to your database.", id: "Scan playlist M3U dari sumber gratis seperti iptv-org, lalu import saluran ke database secara langsung.", es: "Escanea listas M3U públicas de fuentes como iptv-org e importa canales directamente a tu base de datos." },
  iptvSourcePreset: { en: "Preset M3U Source", id: "Sumber Preset M3U", es: "Fuente M3U Predefinida" },
  iptvCustomUrl: { en: "Or enter Custom M3U URL...", id: "Atau masukkan URL M3U Kustom...", es: "O introduce una URL M3U personalizada..." },
  iptvScanBtn: { en: "Scan Playlist", id: "Pindai Playlist", es: "Escanear Lista" },
  iptvScanning: { en: "Scanning M3U...", id: "Memindai M3U...", es: "Escaneando M3U..." },
  iptvFoundChannels: { en: "channels found", id: "saluran ditemukan", es: "canales encontrados" },
  iptvSelectImportDesc: { en: "Select the channels you wish to import into the catalog database.", id: "Pilih saluran yang ingin diimport ke database aplikasi.", es: "Selecciona los canales que deseas importar a la base de datos." },
  iptvSelectOnlineOnly: { en: "Select Online Streams Only", id: "Pilih Stream Online Only", es: "Seleccionar Solo Transmisiones en Línea" },
  iptvSelectAll: { en: "Select All", id: "Pilih Semua", es: "Seleccionar Todos" },
  iptvDeselectAll: { en: "Deselect All", id: "Batal Pilih", es: "Deseleccionar Todos" },
  iptvImportSelected: { en: "Import Selected Channels", id: "Import Saluran Terpilih", es: "Importar Canales Seleccionados" },
  iptvFilterPlaceholder: { en: "Filter channel name...", id: "Filter nama channel...", es: "Filtrar por nombre de canal..." },
  iptvAllCategories: { en: "All Categories", id: "Semua Kategori", es: "Todas las Categorías" },
  iptvAllCountries: { en: "All Countries", id: "Semua Negara", es: "Todos los Países" },
  iptvNoMatch: { en: "No channels match the current filter.", id: "Tidak ada saluran yang sesuai filter.", es: "No hay canales que coincidan con el filtro actual." },
  iptvChannelCol: { en: "Channel", id: "Saluran", es: "Canal" },
  iptvCategoryCol: { en: "Category", id: "Kategori", es: "Categoría" },
  iptvCountryCol: { en: "Country", id: "Negara", es: "País" },
  iptvScanFailed: { en: "Failed to scan playlist. Please try again.", id: "Gagal memindai playlist. Coba lagi.", es: "Error al escanear la lista. Inténtalo de nuevo." },
  iptvNetworkError: { en: "Connection failed. Please check your internet connection.", id: "Koneksi gagal. Periksa koneksi internet Anda.", es: "Error de conexión. Verifica tu conexión a internet." },

  // GDriveScanner
  gdriveTitle: { en: "Google Drive Catalog Importer", id: "Pengimpor Katalog Google Drive", es: "Importador de Catálogo de Google Drive" },
  gdriveDesc: { en: "Import video files directly from Google Drive public/shared folders.", id: "Impor file video langsung dari folder publik/berbagi Google Drive.", es: "Importa archivos de video directamente desde carpetas compartidas de Google Drive." },
  gdriveScanBtn: { en: "Scan Google Drive", id: "Pindai Google Drive", es: "Escanear Google Drive" },
  gdriveScanning: { en: "Scanning Folder...", id: "Memindai Folder...", es: "Escaneando Carpeta..." },
  gdriveSuccessImport: { en: "Successfully Imported!", id: "Berhasil Mengimpor!", es: "¡Importado con Éxito!" },
  gdriveImportSelected: { en: "Import Selected Movies", id: "Impor Film Terpilih", es: "Importar Películas Seleccionadas" },
  gdriveSelectAllNew: { en: "Select All New", id: "Pilih Semua yang Baru", es: "Seleccionar Todos los Nuevos" },
  gdriveDeselectAll: { en: "Deselect All", id: "Batal Pilih Semua", es: "Deseleccionar Todos" },
  gdriveScanFailed: { en: "Failed to scan Google Drive folder.", id: "Gagal memindai folder Google Drive.", es: "Error al escanear la carpeta de Google Drive." },
  gdriveImportFailed: { en: "Failed to import movies into database.", id: "Gagal mengimpor film ke database.", es: "Error al importar películas a la base de datos." }
};

let content = fs.readFileSync('src/translations.ts', 'utf8');

function formatEntries(lang) {
  const lines = [];
  for (const [k, v] of Object.entries(newTranslations)) {
    const val = v[lang].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`    ${k}: "${val}",`);
  }
  return lines.join('\n');
}

// Insert before `cmsSyncingDb` or at end of each section
const enEntries = '\n' + formatEntries('en') + '\n';
const idEntries = '\n' + formatEntries('id') + '\n';
const esEntries = '\n' + formatEntries('es') + '\n';

// Replace `cmsSyncingDb: "Synchronizing CMS database models..."`
content = content.replace(
  'cmsSyncingDb: "Synchronizing CMS database models..."',
  'cmsSyncingDb: "Synchronizing CMS database models...",' + enEntries.trimEnd()
);

content = content.replace(
  'cmsSyncingDb: "Menyinkronkan model database CMS..."',
  'cmsSyncingDb: "Menyinkronkan model database CMS...",' + idEntries.trimEnd()
);

content = content.replace(
  'cmsSyncingDb: "Sincronizando modelos de base de datos CMS..."',
  'cmsSyncingDb: "Sincronizando modelos de base de datos CMS...",' + esEntries.trimEnd()
);

fs.writeFileSync('src/translations.ts', content, 'utf8');
console.log('Successfully updated src/translations.ts!');
console.log('Added', Object.keys(newTranslations).length, 'new keys to all 3 languages.');
