const fs = require('fs');

let s = fs.readFileSync('src/translations.ts', 'utf8');

const enAdd = `    adminAccessDenied: "Your account does not have administrator privileges to view this console.",\n    adminSignInPrompt: "Please sign in with an administrator account to access the dashboard.",`;
const idAdd = `    adminAccessDenied: "Akun Anda tidak memiliki hak istimewa administrator untuk melihat konsol ini.",\n    adminSignInPrompt: "Silakan masuk dengan akun administrator untuk mengakses dasbor.",`;
const esAdd = `    adminAccessDenied: "Tu cuenta no tiene privilegios de administrador para ver esta consola.",\n    adminSignInPrompt: "Por favor, inicia sesión con una cuenta de administrador para acceder al panel.",`;

s = s.replace('memberSince: "Member Since",', 'memberSince: "Member Since",\n' + enAdd);
s = s.replace('memberSince: "Bergabung Sejak",', 'memberSince: "Bergabung Sejak",\n' + idAdd);
s = s.replace('memberSince: "Miembro Desde",', 'memberSince: "Miembro Desde",\n' + esAdd);

fs.writeFileSync('src/translations.ts', s, 'utf8');
console.log('Added adminAccessDenied and adminSignInPrompt to translations.ts!');
