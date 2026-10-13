const fs = require('fs');
const path = require('path');

const srcDir = 'src';
const indonesianWords = [
  'saluran', 'tambah', 'hapus', 'batal', 'simpan', 'ubah', 'pilih', 'berhasil', 'gagal',
  'pengaturan', 'keluar', 'masuk', 'unduh', 'putar', 'tonton', 'daftar', 'peringatan',
  'semua', 'kategori', 'negara', 'bahasa', 'kualitas', 'deskripsi', 'nama', 'durasi'
];

function scanFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanFiles(full);
    } else if (f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      const findings = [];
      lines.forEach((line, idx) => {
        // Skip imports and comments
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
        if (line.includes('translations.ts')) return;
        
        for (const word of indonesianWords) {
          const regex = new RegExp(`(?<=>|["'\`])([^"'\`<>]*\\b${word}\\b[^"'\`<>]*)(?=<|["'\`])`, 'i');
          if (regex.test(line)) {
            findings.push({ line: idx + 1, text: line.trim() });
            break;
          }
        }
      });
      if (findings.length > 0) {
        console.log(`\n=== ${full} (${findings.length} matches) ===`);
        findings.slice(0, 15).forEach(m => console.log(`  L${m.line}: ${m.text}`));
      }
    }
  }
}

scanFiles(srcDir);
