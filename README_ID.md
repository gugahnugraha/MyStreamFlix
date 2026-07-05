# 🎬 CineManiac - Web App Portal Streaming Premium & CMS Full-Stack

CineManiac adalah portal streaming film berkinerja tinggi yang dirancang dengan antarmuka gelap premium yang sangat modern. Sempurna bagi developer yang ingin meluncurkan situs streaming, perpustakaan video, atau portofolio multimedia mereka sendiri. Aplikasi ini menggabungkan pemutar video sinematik dengan simulasi kegagalan stream (*playback fallback*), sistem rating interaktif, dasbor analitik real-time, serta CMS Admin yang komprehensif (termasuk manajemen pengguna aktif).

---

## ✨ Fitur Utama

### 🎥 Pengalaman Sinematik Pengguna (Front-End)
*   **Hero Spotlight & Carousel**: Slide otomatis yang berjalan mulus dengan animasi CSS bawaan yang dipercepat perangkat keras (`fadeInScale` dan `slideUpText`).
*   **Pencarian & Filter Instan**: Cari judul film favorit secara instan atau jelajahi berdasarkan kategori genre.
*   **Pemutar Media Sinematik Premium**:
    *   Mendukung pemutaran langsung file MP4/HLS.
    *   **Fitur Simulasi Sinematik Interaktif (Fallback)**: Jika URL stream video rusak atau terblokir, pemutar media akan otomatis beralih ke mode simulasi premium lengkap dengan subtitle berjalan, kontrol kecepatan, status resolusi, overlay detail film, dan toleransi error untuk mencegah layar mati yang merusak kenyamanan pengguna.
*   **Rekomendasi Pintar**: Rekomendasi film "More Like This" yang dihitung secara dinamis berdasarkan kecocokan genre film.
*   **Ulasan & Rating**: Fitur pengiriman ulasan (skala rating 1-10) disertai kolom komentar interaktif.

### 🔐 Manajemen Pengguna & Keamanan Multi-Role
*   **Sistem Autentikasi Lengkap**: Fitur masuk (*login*), pendaftaran akun (*sign-up*), serta halaman profil pengguna.
*   **Pusat Kontrol Admin CMS**:
    *   **Manajemen Basis Pengguna**: Administrator utama dapat mengubah tingkat otorisasi pengguna (mempromosikan/mendemosikan Admin) atau menghapus akun pengguna secara permanen.
    *   **Kustomisasi Katalog Film**: Tambah, edit, atau hapus film dari katalog secara langsung lengkap dengan pengaturan URL poster, URL cuplikan, subtitle, genre, dan rating dasar.
    *   **Statistik & Analitik Real-Time**: Pantau performa situs melalui statistik harian (Pengguna Aktif, Total Penayangan, Estimasi Jam Streaming) dalam tampilan grid grafik yang interaktif.
    *   **SEO & Pengaturan Global**: Sesuaikan tag metadata web, deskripsi pencarian utama, dan tombol toggle global untuk mode simulasi default langsung melalui UI.

---

## 🛠️ Arsitektur Teknologi

*   **Frontend**: React 18, Vite (pemrosesan aset dan rendering kilat), Tailwind CSS, Lucide React (ikon vektor modern).
*   **Backend**: Node.js, Express (sistem API RESTful yang cepat, modular, dan hemat memori).
*   **Database**: Mesin penyimpanan data persisten dalam memori (*in-memory state*) yang mendukung multi-user, ulasan, serta pelacakan metrik. Sangat portabel—langsung berjalan mulus tanpa memerlukan instalasi database eksternal yang rumit saat pertama kali dijalankan.
*   **Animasi**: Kustomisasi animasi CSS terakselerasi untuk transisi visual yang halus dan estetik.

---

## 📂 Struktur Folder

```text
├── server.ts              # Endpoint API Express & Logika sesi pengguna
├── index.html             # Dokumen HTML utama
├── package.json           # Perintah skrip & manajemen dependensi pustaka
├── tsconfig.json          # Konfigurasi kompilator TypeScript
├── vite.config.ts         # Konfigurasi bundler Vite
└── src/
    ├── main.tsx           # Titik masuk utama React (mounting)
    ├── App.tsx            # Pengatur rute & tampilan halaman utama
    ├── index.css          # Gaya global, integrasi tailwind, & animasi kustom
    ├── types.ts           # Antarmuka (Interface) & tipe data TypeScript
    └── components/
        ├── Header.tsx     # Menu navigasi & Status profil pengguna
        ├── MovieCard.tsx  # Kartu film interaktif dengan efek transisi melayang
        ├── MovieCarousel.tsx # Slider spotlight otomatis di bagian atas web
        ├── MovieDetailModal.tsx # Detail film, kolom ulasan, & rekomendasi mirip
        ├── MediaPlayer.tsx # Pemutar video sinematik dengan simulasi cerdas
        ├── AuthModal.tsx  # Dialog masuk & pendaftaran akun
        └── AdminCMS.tsx   # Panel admin, CMS film, Manajemen user, & Statistik
```

---

## 🚀 Panduan Instalasi Mudah

### Prasyarat Sebelum Instalasi
Pastikan komputer Anda sudah terinstal aplikasi berikut:
*   [Node.js](https://nodejs.org/) (Sangat direkomendasikan versi 18.x ke atas)
*   [npm](https://www.npmjs.com/) (Biasanya sudah otomatis terpasap bersama Node.js)

### Langkah 1: Ekstrak atau Clone Proyek
Unduh dan ekstrak berkas ZIP proyek ke dalam folder komputer Anda.
```bash
cd cinemaniac-app
```

### Langkah 2: Instalasi Dependensi
Jalankan perintah berikut di terminal untuk mengunduh semua pustaka yang diperlukan:
```bash
npm install
```

### Langkah 3: Jalankan Server Pengembangan (Dev Mode)
Nyalakan server lokal untuk mulai menggunakan dan memodifikasi aplikasi secara langsung:
```bash
npm run dev
```
Buka peramban (*browser*) Anda lalu akses alamat **`http://localhost:3000`** untuk melihat aplikasi berjalan!

### Langkah 4: Kompilasi untuk Produksi (Build)
Untuk membuat bundel kode yang dioptimalkan untuk performa tinggi di server langsung:
```bash
npm run build
```
Proses ini akan mengompilasi dua hal:
1.  Aset visual frontend React dikompilasi menjadi file statis ringan di dalam folder `dist/`.
2.  Server Express Node.js dikompilasi menjadi file tunggal efisien `dist/server.cjs` menggunakan `esbuild`.

Untuk menjalankan server hasil kompilasi produksi tersebut:
```bash
npm run start
```

---

## 🛡️ Akun Administrator Default
Gunakan akun bawaan berikut untuk mencoba fitur Admin CMS secara langsung setelah instalasi selesai:
*   **Email**: `admin@cine.com`
*   **Password**: `admin123`

*(Catatan: Pengguna baru yang mendaftar melalui tombol sign-up akan otomatis berstatus "Standard Viewer" dan dapat dinaikkan pangkatnya menjadi Admin oleh Admin yang sudah ada melalui tab "User Base" di panel CMS).*

---

## 📄 Lisensi & Ketentuan Pembelian

Membeli proyek ini memberi Anda hak berupa **Lisensi Penggunaan Pribadi** atau **Lisensi Komersial Tanpa Batas** berdasarkan pilihan Anda pada saat pembayaran:
*   **Lisensi Pribadi**: Anda diperbolehkan menggunakan proyek ini untuk keperluan pembelajaran, portofolio pribadi, atau penayangan lokal. Dilarang keras membagikan ulang, mengunggah di repositori publik, atau menjual kembali kode sumber ini.
*   **Lisensi Komersial**: Anda diperbolehkan mengubah merek (*rebranding*), memodifikasi kode, dan mendistribusikannya sebagai portal komersial berbayar untuk klien atau proyek web bisnis Anda sendiri.

Untuk bantuan teknis lebih lanjut, silakan hubungi kami melalui meja bantuan portal pembelian Anda. Selamat berkarya! 🎬🍿
