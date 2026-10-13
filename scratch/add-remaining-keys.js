const fs = require('fs');

let content = fs.readFileSync('src/translations.ts', 'utf8');

const esKeys = `
    adminAccessDenied: "Su cuenta no tiene privilegios de administrador para ver esta consola.",
    adminSignInPrompt: "Inicie sesión con una cuenta de administrador para acceder al panel.",
    cmsCorsSuccessAdd: "¡Dominio agregado a la lista blanca de CORS Proxy!",
    cmsCorsReset: "Lista blanca de dominios proxy restablecida a los valores predeterminados.",
    cmsDeletedSuccess: "canales eliminados con éxito.",
    cmsDeleteFailed: "Error al eliminar los canales.",
    cmsImportSuccess: "¡Canales de TV en Vivo importados con éxito!",
    skipped: "canales omitidos",
    cmsBulkImportFailed: "Error al realizar la importación masiva.",
    cmsChannelImported: "¡importado exitosamente a la base de datos!",
    memberSince: "Miembro desde",
`;

// Fix double comma if any
content = content.replace('spanishLabel: "Español (ES)",,', 'spanishLabel: "Español (ES)",');

// Insert into es before the closing of translations:
content = content.replace(/(spanishLabel:\s*"Español \(ES\)",\s*)(\r?\n\s*\}\s*\r?\n\s*\};)/, (match, p1, p2) => {
  return p1 + esKeys + p2;
});

fs.writeFileSync('src/translations.ts', content, 'utf8');
console.log('Fixed ES in translations.ts');
