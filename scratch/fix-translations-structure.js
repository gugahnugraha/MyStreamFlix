const fs = require('fs');

const content = fs.readFileSync('src/translations.ts', 'utf8');

// Parse EN block (everything from en: { up to id:)
const enBlock = content.match(/en:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*id:/)[1];
const idBlock = content.match(/id:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*es:/)[1];
const esBlock = content.match(/es:\s*\{([\s\S]*?)\n\s*\}\s*\n\};/)[1];

function parseKeys(block) {
  const result = {};
  const regex = /^\s*(["']?[\w\-]+["']?)\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gm;
  let match;
  while ((match = regex.exec(block)) !== null) {
    const key = match[1].replace(/["']/g, '');
    const val = eval(match[2]);
    result[key] = val;
  }
  return result;
}

const en = parseKeys(enBlock);
const id = parseKeys(idBlock);
const es = parseKeys(esBlock);

// Clean up: For memberSince, adminAccessDenied, adminSignInPrompt:
en.memberSince = "Member Since";
en.adminAccessDenied = "Your account does not have administrator privileges to view this console.";
en.adminSignInPrompt = "Please sign in with an administrator account to access the dashboard.";

id.memberSince = "Bergabung Sejak";
id.adminAccessDenied = "Akun Anda tidak memiliki hak istimewa administrator untuk melihat konsol ini.";
id.adminSignInPrompt = "Silakan masuk dengan akun administrator untuk mengakses dasbor.";

es.memberSince = "Miembro Desde";
es.adminAccessDenied = "Tu cuenta no tiene privilegios de administrador para ver esta consola.";
es.adminSignInPrompt = "Por favor, inicia sesión con una cuenta de administrador para acceder al panel.";

// Get all unique keys from en
const allKeys = Object.keys(en);

// Check if any key is missing in id or es, and fill if missing
for (const k of allKeys) {
  if (id[k] === undefined) {
    console.log('ID missing:', k);
    id[k] = en[k];
  }
  if (es[k] === undefined) {
    console.log('ES missing:', k);
    es[k] = en[k];
  }
}

// Generate clean translations.ts
function stringifyLang(obj) {
  const lines = [];
  for (const k of allKeys) {
    const val = obj[k] !== undefined ? obj[k] : en[k];
    const safeVal = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeKey = k.includes('-') ? `"${k}"` : k;
    lines.push(`    ${safeKey}: "${safeVal}",`);
  }
  return lines.join('\n');
}

const newFileContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageCode = "en" | "id" | "es";

export const translations = {
  en: {
${stringifyLang(en)}
  },
  id: {
${stringifyLang(id)}
  },
  es: {
${stringifyLang(es)}
  }
};

export function getTranslation(lang: LanguageCode) {
  return translations[lang] || translations.en;
}
`;

fs.writeFileSync('src/translations.ts', newFileContent, 'utf8');
console.log('src/translations.ts successfully rebuilt and synchronized with', allKeys.length, 'keys across all languages!');
