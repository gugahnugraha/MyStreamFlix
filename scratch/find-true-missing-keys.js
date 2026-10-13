const fs = require('fs');

const translations = fs.readFileSync('src/translations.ts', 'utf8');
const enBlock = translations.match(/en:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*id:/)[1];
const enKeys = new Set();
for (const line of enBlock.split('\n')) {
  const m = line.match(/^\s*([a-zA-Z0-9_]+|"[^"]+")\s*:/);
  if (m) enKeys.add(m[1].replace(/"/g, ''));
}

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

const jsReserved = new Set([
  'trim', 'split', 'replace', 'toLowerCase', 'toUpperCase', 'length', 'map', 'filter', 'sort', 'slice',
  'join', 'forEach', 'reduce', 'find', 'findIndex', 'some', 'every', 'includes', 'indexOf', 'has', 'add',
  'delete', 'keys', 'values', 'entries', 'push', 'pop', 'shift', 'unshift', 'destroy', 'reset', 'toFixed',
  'target', 'value', 'checked', 'files', 'preventDefault', 'stopPropagation', 'closest', 'querySelector',
  'addEventListener', 'removeEventListener', 'requestFullscreen', 'exitFullscreen', 'fullscreenElement',
  'scrollBy', 'getBoundingClientRect', 'style', 'documentElement', 'getElementById', 'width', 'left',
  'currentTime', 'volume', 'muted', 'duration', 'time', 'y', 'x', 'initialBright', 'initialVol', 'dataTransfer',
  'FormEvent', 'ChangeEvent', 'MouseEvent', 'TouchEvent', 'DragEvent', 'ReactNode', 'CSSProperties', 'Key',
  'title', 'id', 'type', 'mediaType', 'posterUrl', 'rating', 'character', 'overview', 'icon', 'label',
  'subtitles', 'movie', 'duration', 'importedCount', 'm3u', 'js', 'currentLevel', 'levels', 'tmdbId', 'toLocaleString'
]);

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  
  // Find `t.key` or `t?.key` where `t` is the translation prop
  // Match specifically `\bt\.(?<key>[a-zA-Z0-9_]+)` or `\bt\?\.(?<key>[a-zA-Z0-9_]+)`
  const tMatches = [...content.matchAll(/\bt\??\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  const realKeys = tMatches.filter(k => !jsReserved.has(k));
  const missing = [...new Set(realKeys)].filter(k => !enKeys.has(k));
  
  if (missing.length > 0) {
    console.log(`\n=== ${file} ===`);
    console.log(`Missing keys in dictionary:`, missing);
  }
}
