const fs = require('fs');

let s = fs.readFileSync('src/translations.ts', 'utf8');

const enAdd = `    cmsDeletedSuccess: "channels successfully removed.",
    cmsDeleteFailed: "Failed to remove channels.",
    cmsImportSuccess: "Live TV channels successfully imported!",
    skipped: "channels skipped",
    cmsBulkImportFailed: "Failed to perform bulk import.",
    cmsChannelImported: "successfully imported into database!",`;

const idAdd = `    cmsDeletedSuccess: "saluran berhasil dihapus.",
    cmsDeleteFailed: "Gagal menghapus saluran.",
    cmsImportSuccess: "saluran Live TV berhasil diimpor!",
    skipped: "saluran dilewati",
    cmsBulkImportFailed: "Gagal melakukan bulk import.",
    cmsChannelImported: "berhasil diimport ke database!",`;

const esAdd = `    cmsDeletedSuccess: "canales eliminados con éxito.",
    cmsDeleteFailed: "Error al eliminar los canales.",
    cmsImportSuccess: "¡canales de TV en vivo importados con éxito!",
    skipped: "canales omitidos",
    cmsBulkImportFailed: "Error al realizar la importación masiva.",
    cmsChannelImported: "¡importado con éxito a la base de datos!",`;

s = s.replace('cmsCorsReset: "Proxy domain whitelist reverted to defaults. 🔄",', 'cmsCorsReset: "Proxy domain whitelist reverted to defaults. 🔄",\n' + enAdd);
s = s.replace('cmsCorsReset: "Whitelist domain proxy dikembalikan ke pengaturan default. 🔄",', 'cmsCorsReset: "Whitelist domain proxy dikembalikan ke pengaturan default. 🔄",\n' + idAdd);
s = s.replace('cmsCorsReset: "Lista blanca de dominios proxy restablecida a los valores predeterminados. 🔄",', 'cmsCorsReset: "Lista blanca de dominios proxy restablecida a los valores predeterminados. 🔄",\n' + esAdd);

fs.writeFileSync('src/translations.ts', s, 'utf8');
console.log('Added last admin keys!');
