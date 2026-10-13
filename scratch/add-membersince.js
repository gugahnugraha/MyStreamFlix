const fs = require('fs');
let s = fs.readFileSync('src/translations.ts', 'utf8');
s = s.replace('spanishLabel: "Español (ES)",', 'spanishLabel: "Español (ES)",\n    memberSince: "Member Since",');
s = s.replace('spanishLabel: "Español (ES)",', 'spanishLabel: "Español (ES)",\n    memberSince: "Bergabung Sejak",');
s = s.replace('spanishLabel: "Español (ES)",', 'spanishLabel: "Español (ES)",\n    memberSince: "Miembro Desde",');
fs.writeFileSync('src/translations.ts', s, 'utf8');
console.log('Added memberSince!');
