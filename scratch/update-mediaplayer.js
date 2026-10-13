const fs = require('fs');

let content = fs.readFileSync('src/components/MediaPlayer.tsx', 'utf8');

content = content.replace(
  'setErrorMessage("🔒 Siaran Terenkripsi DRM (Widevine / PlayReady). Pemutar web publik tidak dapat memutar siaran terenkripsi tanpa kunci lisensi resmi.");',
  'setErrorMessage(t?.drmErrorDesc || "This broadcast is protected by DRM (Widevine/PlayReady). Public web players cannot decrypt this stream without official license keys.");'
);

content = content.replace(
  'setErrorMessage("🔒 Siaran Terenkripsi DRM (Widevine / PlayReady). Pemutar web publik tidak dapat memutar siaran terenkripsi tanpa kunci lisensi resmi.");',
  'setErrorMessage(t?.drmErrorDesc || "This broadcast is protected by DRM (Widevine/PlayReady). Public web players cannot decrypt this stream without official license keys.");'
);

content = content.replace(
  'setErrorMessage("⚠️ Gagal memutar siaran DASH. Pastikan saluran aktif dan mengizinkan pemutaran.");',
  'setErrorMessage(t?.dashErrorDesc || "Failed to play DASH broadcast. Ensure the channel is online and permits cross-origin playback.");'
);

content = content.replace(
  '<span>{isDrmError ? "SIARAN TERENKRIPSI (DRM)" : "GAGAL MEMUTAR SIARAN"}</span>',
  '<span>{isDrmError ? (t?.drmErrorTitle || "DRM ENCRYPTED STREAM") : (t?.streamFailedTitle || "FAILED TO PLAY STREAM")}</span>'
);

content = content.replace(
  `                  {isDrmError
                    ? "Siaran ini dilindungi oleh DRM (Widevine/PlayReady). Pemutar web publik tidak dapat mendekripsi siaran tanpa sertifikat & lisensi resmi."
                    : (errorMessage || "Tidak dapat menghubungkan ke siaran langsung. Silakan periksa koneksi atau pilih saluran lain.")}`,
  `                  {isDrmError
                    ? (t?.drmErrorDesc || "This broadcast is protected by DRM (Widevine/PlayReady). Public web players cannot decrypt this stream without official license keys.")
                    : (errorMessage || t?.streamFailedDesc || "Cannot connect to the live broadcast. Please check your network connection or select another channel.")}`
);

content = content.replace(
  '<span>Pengaturan Subtitle</span>',
  '<span>{t?.subtitleSettings || "Subtitle Settings"}</span>'
);

fs.writeFileSync('src/components/MediaPlayer.tsx', content, 'utf8');
console.log('Successfully updated src/components/MediaPlayer.tsx!');
