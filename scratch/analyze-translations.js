const fs = require('fs');

const content = fs.readFileSync('src/translations.ts', 'utf8');

const enMatch = content.match(/en:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*id:/);
const idMatch = content.match(/id:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*es:/);
const esMatch = content.match(/es:\s*\{([\s\S]*?)\n\s*\}\s*\n\};/);

function getKeys(str) {
  if (!str) return [];
  const lines = str.split('\n');
  const keys = [];
  for (const line of lines) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+|"[^"]+")\s*:/);
    if (m) keys.push(m[1].replace(/"/g, ''));
  }
  return keys;
}

const enKeys = getKeys(enMatch ? enMatch[1] : '');
const idKeys = getKeys(idMatch ? idMatch[1] : '');
const esKeys = getKeys(esMatch ? esMatch[1] : '');

console.log('EN keys count:', enKeys.length);
console.log('ID keys count:', idKeys.length);
console.log('ES keys count:', esKeys.length);

const enSet = new Set(enKeys);
const idSet = new Set(idKeys);
const esSet = new Set(esKeys);

const missingInId = enKeys.filter(k => !idSet.has(k));
const missingInEs = enKeys.filter(k => !esSet.has(k));
const extraInId = idKeys.filter(k => !enSet.has(k));
const extraInEs = esKeys.filter(k => !enSet.has(k));

console.log('Missing in ID (' + missingInId.length + '):', missingInId);
console.log('Missing in ES (' + missingInEs.length + '):', missingInEs);
console.log('Extra in ID (' + extraInId.length + '):', extraInId);
console.log('Extra in ES (' + extraInEs.length + '):', extraInEs);
