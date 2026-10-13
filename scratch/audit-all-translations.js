const fs = require('fs');
const path = require('path');

const translations = fs.readFileSync('src/translations.ts', 'utf8');

// Extract all keys defined in EN
const enBlock = translations.match(/en:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*id:/)[1];
const enKeys = new Set();
for (const line of enBlock.split('\n')) {
  const m = line.match(/^\s*([a-zA-Z0-9_]+|"[^"]+")\s*:/);
  if (m) enKeys.add(m[1].replace(/"/g, ''));
}

console.log('Total translation dictionary keys:', enKeys.size);

// Scan files
const files = [
  'src/App.tsx',
  'src/components/AdminCMS.tsx',
  'src/components/AuthModal.tsx',
  'src/components/CastDetailView.tsx',
  'src/components/Footer.tsx',
  'src/components/GDriveScanner.tsx',
  'src/components/Header.tsx',
  'src/components/IPTVScanner.tsx',
  'src/components/LiveTvPage.tsx',
  'src/components/MediaPlayer.tsx',
  'src/components/MobileBottomNav.tsx',
  'src/components/MovieCard.tsx',
  'src/components/MovieCarousel.tsx',
  'src/components/MovieDetailModal.tsx',
  'src/components/MovieRow.tsx',
  'src/components/ProfileModal.tsx',
  'src/components/SubscriptionModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  
  // Find `t.key` or `t?.key` usages
  const tUsages = new Set();
  const tMatches = content.matchAll(/t(?:\?|\.)([a-zA-Z0-9_]+)/g);
  for (const m of tMatches) {
    tUsages.add(m[1]);
  }
  
  // Check which used keys are NOT in enKeys
  const missingKeys = [...tUsages].filter(k => !enKeys.has(k));
  
  // Find potential hardcoded text in JSX: e.g. >Some Text< or title="Some Text" or placeholder="Some Text"
  const lines = content.split('\n');
  const hardcodedLines = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    
    // Check for Indonesian words
    if (/(?:berhasil|gagal|saluran|pengaturan|hapus|batal|simpan|ubah|pilih|semua|kategori|negara|bahasa|kualitas|deskripsi|putar|tonton)/i.test(trimmed)) {
      hardcodedLines.push({ type: 'indo', line: idx + 1, text: trimmed });
    }
  });

  console.log(`\n=== ${file} ===`);
  console.log(`  Used translation keys: ${tUsages.size}`);
  if (missingKeys.length > 0) {
    console.log(`  ⚠️ KEYS USED BUT MISSING IN translations.ts (${missingKeys.length}):`, missingKeys);
  }
  if (hardcodedLines.length > 0) {
    console.log(`  ⚠️ Lines with hardcoded Indonesian (${hardcodedLines.length}):`);
    hardcodedLines.slice(0, 8).forEach(h => console.log(`    L${h.line}: ${h.text.substring(0, 100)}`));
  }
}
