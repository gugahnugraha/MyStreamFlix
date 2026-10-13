const fs = require('fs');
let s = fs.readFileSync('src/translations.ts', 'utf8');
s = s.replace('gdriveImportFailed: "Failed to import movies into database.",', 'gdriveImportFailed: "Failed to import movies into database.",\n    tapToPlay: "Tap to start live stream",');
s = s.replace('gdriveImportFailed: "Gagal mengimpor film ke database.",', 'gdriveImportFailed: "Gagal mengimpor film ke database.",\n    tapToPlay: "Ketuk untuk memulai siaran langsung",');
s = s.replace('gdriveImportFailed: "Error al importar películas a la base de datos.",', 'gdriveImportFailed: "Error al importar películas a la base de datos.",\n    tapToPlay: "Toca para iniciar la transmisión en vivo",');
fs.writeFileSync('src/translations.ts', s, 'utf8');
console.log('Added tapToPlay!');
