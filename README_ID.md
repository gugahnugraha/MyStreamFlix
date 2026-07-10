# 🎬 MyStreamFlix - Kerangka Kerja Video-on-Demand (VoD) Cinematic Premium & SaaS CMS

MyStreamFlix adalah platform streaming full-stack berkinerja tinggi dengan desain antarmuka gelap sinematik yang premium. Dibangun menggunakan **Next.js 15 (App Router)** dan **Prisma ORM**, templat ini dioptimalkan bagi pengembang yang ingin meluncurkan platform streaming, perpustakaan video, situs kursus online, atau toko media digital mereka sendiri di Vercel secara mandiri.

Aplikasi ini dilengkapi pemutar video sinematik yang menawan, papan komentar interaktif, dasbor analitik real-time, dan manajemen CMS administratif yang lengkap.

---

## ⚡ Sorotan Utama & Arsitektur

- **Next.js 15 App Router**: Menggunakan arsitektur Next.js App Router modern yang siap untuk serverless dan dioptimalkan secara penuh.
- **Mesin Penyimpanan Data Hibrida (Zero-Config Fallback)**:
  - **In-Memory Mode**: Jika database tidak dikonfigurasi, aplikasi akan berjalan secara instan menggunakan penyimpanan RAM in-memory lokal yang sudah dimuat dengan data dummy film dan akun uji coba. Sangat cocok untuk pratinjau lokal tanpa instalasi database!
  - **Prisma Database Mode**: Ketika `DATABASE_URL` disetel pada berkas `.env`, aplikasi akan secara otomatis beralih menggunakan database asli. Kompatibel dengan **Supabase**, **MongoDB**, dan **PostgreSQL**.
- **Stateful Multi-User Space & Sesi Aman**:
  - **Cryptographically Signed Cookies (HMAC SHA-256)**: Menggunakan tanda tangan kriptografis pada cookie sesi pengguna untuk mencegah peretasan sesi (*session hijacking*) atau manipulasi ID pengguna dari sisi browser.
  - **Persistensi Sesi**: Sesi pengguna dan data in-memory di-cache secara global sehingga tetap bertahan aman meskipun server melakukan Hot Module Replacement (HMR) atau halaman browser di-refresh.
  - **Personalisasi**: Memungkinkan pengguna membuat profil terpisah (termasuk filter profil Kids), menyimpan daftar favorit/watchlist pribadi, riwayat tontonan (dengan resume points), dan riwayat ulasan film.
- **Tailwind CSS v4 & Motion**: Animasi yang mulus dan didukung akselerasi perangkat keras (`fadeInScale`, `slideUpText`) untuk menghadirkan pengalaman streaming premium kelas dunia.
- **Penyimpanan Fleksibel (Storage Agnostic)**: Putar berkas film dari penyimpanan cloud mana saja seperti Amazon S3, Cloudflare R2, BunnyCDN, Google Cloud Storage, atau tautan video publik lainnya dengan menyalin URL-nya di Admin CMS.

---

## 🚀 Fitur Utama yang Telah Tersedia

### 1. Advanced Fullscreen Video Player
- **Scoped Fullscreen**: Ketika menekan tombol fullscreen pada pemutar video, hanya panel video saja yang membesar memenuhi layar monitor (menyembunyikan panel samping daftar episode TV Series) agar fokus tontonan maksimal.
- **Custom HUD Control Overlays**: Dilengkapi tombol kustom Play/Pause, pengatur kecepatan putar (speed), tingkat volume, bisukan (mute), slider garis waktu (progress timeline), dan tombol keluar.
- **Sinkronisasi Otomatis**: Ikon Maximize/Minimize dan label pemutar video akan tersinkronisasi secara otomatis saat keluar dari fullscreen menggunakan tombol *Escape (Esc)* fisik keyboard.
- **Multi-Language Subtitles**: Simulasi teks subtitle film interaktif dalam Bahasa Indonesia, Inggris, Spanyol, dan Prancis.

### 2. Administratif CMS & Katalog CRUD
- **Sortir Lanjutan (Advanced Sorting)**: Mengurutkan tabel katalog film berdasarkan Baru Ditambahkan, Judul (A-Z / Z-A), Tahun Rilis (Terbaru/Terlama), dan Popularitas (Views/Likes).
- **Pencarian & Filter Estetik**: Memfilter daftar tabel katalog berdasarkan tipe konten (Movies vs TV Series) atau kata kunci pencarian (judul, genre, sutradara, cast) secara real-time.
- **Tabel Katalog Teroptimasi**: Dilengkapi dengan scrollbar vertikal dengan batas tinggi maksimal (`max-h-[550px]`) dan baris header melayang (*sticky header*) untuk navigasi katalog berjumlah besar secara nyaman.
- **TV Series Builder**: Form pembuatan dinamis untuk menambahkan musim (*season*), episode, tautan video, dan durasi kustom.
- **Dasbor Analitik Utama**: Menampilkan grafik total film, akumulasi total tayangan (*views*), suka (*likes*), dan rasio akun premium.

---

## 📂 Struktur Direktori

```text
├── prisma/
│   ├── schema.prisma          # Skema default SQL (Supabase/PostgreSQL)
│   └── schema.mongodb.prisma  # Skema variasi untuk MongoDB
├── app/                       # Next.js App Router (halaman & rute API)
│   ├── api/                   # Serverless REST endpoints
│   ├── layout.tsx             # Pembungkus halaman root & impor font
│   ├── page.tsx               # Titik masuk utama aplikasi (Client-side)
│   └── globals.css            # Stylesheet utama (Konfigurasi tema Tailwind v4)
├── src/
│   ├── components/            # Komponen UI (Header, MediaPlayer, AdminCMS, dll.)
│   ├── lib/                   # Utilitas, Sesi, Prisma, dan In-Memory Store
│   │   ├── db.ts              # Inisialisasi Prisma Client
│   │   ├── in-memory-db.ts    # Database Mock/In-Memory global (persisten saat reload)
│   │   ├── data-service.ts    # Lapisan Akses Data Hibrida (DAL)
│   │   └── tmdb.ts            # Penyedia integrasi data TMDB
│   ├── types.ts               # Definisi Tipe TypeScript
│   └── translations.ts        # Kamus Lokalisasi Bahasa (EN / ID / ES)
```

---

## 🛠️ Instalasi & Memulai Proyek

### Persyaratan Sistem
Pastikan perangkat Anda sudah terinstal:
- **Node.js** (Versi 18.x atau yang lebih baru)
- **npm** (biasanya otomatis terinstal bersama Node.js)

### Langkah 1: Masuk ke Direktori Proyek
Ekstrak berkas zip proyek ini lalu masuk ke foldernya di terminal:
```bash
cd MyStreamFlix
```

### Langkah 2: Instal Dependensi
Instal semua modul yang diperlukan:
```bash
npm install
```

### Langkah 3: Jalankan Server Lokal (In-Memory Fallback)
Mulai server pengembangan:
```bash
npm run dev
```
Buka **`http://localhost:3000`** di peramban (browser) Anda.
Aplikasi akan secara otomatis berjalan dalam **Mode In-Memory** karena variabel `DATABASE_URL` belum disetel pada berkas `.env`. Anda bisa langsung menjelajahinya, login sebagai admin, membuat profil anak-anak, memutar video, dan menambahkan konten film baru!

---

## 🗄️ Panduan Integrasi Database (Supabase, PostgreSQL, MongoDB)

Untuk menyimpan akun pengguna, katalog film, dan riwayat tontonan secara permanen, hubungkan database menggunakan Prisma ORM.

### Opsi A: Supabase (PostgreSQL) - *Sangat Direkomendasikan*
Supabase menyediakan database PostgreSQL cloud gratis yang sangat stabil dan cocok untuk Next.js di Vercel.

1. **Dapatkan string koneksi database**:
   - Masuk ke dashboard proyek Supabase Anda -> **Project Settings** -> **Database**.
   - Salin string koneksi **Transaction** (biasanya diawali dengan `postgres://...` atau `postgresql://...`). Gunakan port transaction pooling (biasanya `6543`) dan tambahkan parameter `?pgbouncer=true` di bagian akhir string.
2. **Konfigurasi berkas `.env`**:
   Buat berkas `.env` di folder root proyek dan masukkan string koneksi tersebut beserta session secret:
   ```env
   DATABASE_URL="postgresql://postgres.[username]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   SESSION_SECRET="kunci_rahasia_sesi_kustom_anda" # Ganti dengan string acak panjang bebas
   TMDB_API_KEY="kunci_api_tmdb_anda" # Opsional
   ```
3. **Migrasikan Struktur Tabel**:
   Jalankan perintah berikut untuk mengunggah skema tabel ke database Supabase Anda:
   ```bash
   npx prisma db push
   ```
4. **Selesai!**:
   Kini ketika Anda menjalankan `npm run dev`, MyStreamFlix akan membaca dan menulis data langsung ke Supabase Anda.

---

### Opsi B: PostgreSQL Umum
Dapat digunakan untuk Amazon RDS, DigitalOcean Databases, Render, atau database lokal PostgreSQL di PC Anda.

1. **Konfigurasi berkas `.env`**:
   ```env
   DATABASE_URL="postgresql://[username]:[password]@[host]:5432/[nama_database]"
   ```
2. **Jalankan Migrasi**:
   Buat berkas migrasi SQL dan terapkan ke database:
   ```bash
   npx prisma migrate dev --name init
   ```

---

### Opsi C: MongoDB (Atlas)
MongoDB adalah database dokumen NoSQL yang sangat fleksibel dan didukung penuh oleh MyStreamFlix.

1. **Siapkan Skema MongoDB**:
   Karena MongoDB menggunakan pemetaan kunci utama (`_id`) yang berbeda dengan database relasional, Anda perlu mengganti skema default dengan skema khusus MongoDB yang sudah kami sediakan:
   ```bash
   copy prisma\schema.mongodb.prisma prisma\schema.prisma
   ```
   *(Pada macOS/Linux: `cp prisma/schema.mongodb.prisma prisma/schema.prisma`)*
2. **Konfigurasi berkas `.env`**:
   Salin URI Koneksi MongoDB Atlas Anda (pastikan nama database telah ditulis di akhir path):
   ```env
   DATABASE_URL="mongodb+srv://[username]:[password]@cluster.mongodb.net/mystreamflix?retryWrites=true&w=majority"
   ```
3. **Terapkan Skema**:
   Buat indeks dan generate klien Prisma dengan perintah:
   ```bash
   npx prisma db push
   ```

---

## 🚀 Panduan Deploy ke Vercel

Mendeploy Next.js ke Vercel sangatlah praktis:

1. Unggah repositori kode Anda ke **GitHub / GitLab / Bitbucket**.
2. Masuk ke dashboard [Vercel](https://vercel.com).
3. Klik **Add New** -> **Project** lalu impor repositori Anda.
4. Tambahkan **Environment Variables** berikut pada konfigurasi proyek di Vercel:
   - `DATABASE_URL` : (String koneksi Supabase, PostgreSQL, atau MongoDB Anda)
   - `SESSION_SECRET` : (Kunci string acak aman untuk menandatangani cookie sesi)
   - `TMDB_API_KEY` : (Opsional, untuk merekomendasikan judul film dari TMDB)
5. Klik **Deploy**! Vercel akan otomatis melakukan kompilasi aplikasi Next.js dan meluncurkan serverless API Anda.

> [!WARNING]
> Ketika dideploy ke Vercel, **Anda wajib mengkonfigurasi database asli**. Mode In-Memory bersifat sementara (volatil) dan akan terhapus secara acak ketika serverless container dibersihkan oleh Vercel.

---

## 🛡️ Informasi Akun Pengujian Default

Gunakan kredensial berikut untuk masuk saat aplikasi berjalan dalam **Mode In-Memory**:

| Role | Email | Password | Tier | Akses |
|---|---|---|---|---|
| **Administrator** | `admin@streamcms.com` | `admin` | Premium VIP | CMS & Dasbor Admin Penuh |
| **Demo Viewer** | `demo@viewer.com` | `demo` | Gratis | Terbatas konten gratis |
| **Premium Viewer** | `premium@viewer.com` | `premium` | Premium VIP | Katalog premium penuh, tanpa admin |

- **Admin** — memiliki akses penuh ke dasbor Admin CMS (CRUD katalog film, analitik, pengaturan situs).
- **Demo Viewer** — pengguna tier gratis standar, dapat menjelajahi konten gratis, mengatur profil, dan berlangganan.
- **Premium Viewer** — pengguna tier berlangganan dengan akses katalog premium penuh, tanpa hak akses admin.

*(Catatan: Pada mode database, ketiga akun pengujian ini akan otomatis dibuat pada database Anda saat pertama kali aplikasi dijalankan).*

---

## 📄 Lisensi & Ketentuan Distribusi

Pembelian produk ini memberikan Anda hak lisensi personal atau komersial:
- **Lisensi Personal**: Boleh digunakan pada perangkat pribadi untuk pembelajaran, modifikasi, atau keperluan hobi. Dilarang keras mendistribusikan ulang atau menjual kembali kode sumber ini di platform publik.
- **Lisensi Komersial**: Boleh diubah mereknya (rebrand), dimodifikasi, dan diluncurkan sebagai portal komersial untuk klien Anda.
