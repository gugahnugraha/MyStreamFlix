const fs = require('fs');

// Check translations.ts for values that are identical between languages or look mixed
const translationsFile = fs.readFileSync('src/translations.ts', 'utf8');

// We can evaluate or import translations.ts by regex or ts-node/transpile
// Let's parse translations object
const enBlock = translationsFile.match(/en:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*id:/)[1];
const idBlock = translationsFile.match(/id:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*es:/)[1];
const esBlock = translationsFile.match(/es:\s*\{([\s\S]*?)\n\s*\}\s*\n\};/)[1];

function parseKV(block) {
  const result = {};
  const regex = /^\s*(["']?[\w\-]+["']?)\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gm;
  let match;
  while ((match = regex.exec(block)) !== null) {
    const key = match[1].replace(/["']/g, '');
    const val = eval(match[2]); // safely parse quoted string
    result[key] = val;
  }
  return result;
}

const en = parseKV(enBlock);
const id = parseKV(idBlock);
const es = parseKV(esBlock);

console.log('Parsed EN keys:', Object.keys(en).length);
console.log('Parsed ID keys:', Object.keys(id).length);
console.log('Parsed ES keys:', Object.keys(es).length);

// Find keys where ID value is same as EN value (potential untranslated english in ID)
const idSameAsEn = [];
for (const k in en) {
  if (en[k] === id[k] && en[k].length > 3 && !['VIP', '4K', 'HD', 'G', 'PG-13', 'R', 'NC-17', 'SD', 'HLS', 'DASH', 'MP4', 'URL', 'CORS', 'ID', 'TMDB'].includes(en[k])) {
    idSameAsEn.push({ key: k, en: en[k] });
  }
}
console.log('\n--- ID same as EN (' + idSameAsEn.length + ') ---');
console.log(idSameAsEn.slice(0, 30));

// Find keys where ES value is same as EN value (potential untranslated english in ES)
const esSameAsEn = [];
for (const k in en) {
  if (en[k] === es[k] && en[k].length > 3 && !['VIP', '4K', 'HD', 'G', 'PG-13', 'R', 'NC-17', 'SD', 'HLS', 'DASH', 'MP4', 'URL', 'CORS', 'ID', 'TMDB'].includes(en[k])) {
    esSameAsEn.push({ key: k, en: en[k] });
  }
}
console.log('\n--- ES same as EN (' + esSameAsEn.length + ') ---');
console.log(esSameAsEn.slice(0, 30));

// Find keys where ES value contains Indonesian words (e.g. "dan", "yang", "di", "saluran", "berhasil", "gagal")
const indonesianWords = ['dan', 'yang', 'untuk', 'dengan', 'saluran', 'berhasil', 'gagal', 'simpan', 'ubah', 'hapus', 'batal', 'pilih'];
const esHasIndo = [];
for (const k in es) {
  const words = es[k].toLowerCase().split(/\s+/);
  if (words.some(w => indonesianWords.includes(w))) {
    esHasIndo.push({ key: k, es: es[k] });
  }
}
console.log('\n--- ES has Indonesian words (' + esHasIndo.length + ') ---');
console.log(esHasIndo);
