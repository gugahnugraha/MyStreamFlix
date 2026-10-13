const fs = require('fs');

let s = fs.readFileSync('src/translations.ts', 'utf8');

const enAdd = `    cmsCorsSuccessAdd: "Domain successfully added to CORS Proxy Whitelist! ✅",\n    cmsCorsReset: "Proxy domain whitelist reverted to defaults. 🔄",`;
const idAdd = `    cmsCorsSuccessAdd: "Domain berhasil ditambahkan ke Whitelist Proxy CORS! ✅",\n    cmsCorsReset: "Whitelist domain proxy dikembalikan ke pengaturan default. 🔄",`;
const esAdd = `    cmsCorsSuccessAdd: "¡Dominio añadido con éxito a la lista blanca del proxy CORS! ✅",\n    cmsCorsReset: "Lista blanca de dominios proxy restablecida a los valores predeterminados. 🔄",`;

s = s.replace('memberSince: "Member Since",', 'memberSince: "Member Since",\n' + enAdd);
s = s.replace('memberSince: "Bergabung Sejak",', 'memberSince: "Bergabung Sejak",\n' + idAdd);
s = s.replace('memberSince: "Miembro Desde",', 'memberSince: "Miembro Desde",\n' + esAdd);

fs.writeFileSync('src/translations.ts', s, 'utf8');
console.log('Added cmsCorsSuccessAdd and cmsCorsReset!');
