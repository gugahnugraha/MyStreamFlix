# 🎬 MyStreamFlix - Kerangka Kerja Video-on-Demand (VoD) Cinematic Premium & SaaS CMS

MyStreamFlix adalah portal streaming full-stack berkinerja tinggi yang dirancang dengan antarmuka pengguna gelap sinematik yang premium. Dibuat menggunakan **Next.js 15 (App Router)** dan **Prisma ORM**, templat ini dioptimalkan bagi pengembang yang ingin meluncurkan platform streaming, perpustakaan video, situs kursus online, atau toko media digital mereka sendiri di Vercel.

Aplikasi ini dilengkapi simulator pemutar video sinematik yang indah, papan komentar, dasbor analitik real-time, dan manajemen CMS administratif yang lengkap.

---

## ⚡ Sorotan Utama & Arsitektur

- **Next.js 15 Unified Stack**: Menggantikan Express dan Vite dengan arsitektur Next.js App Router yang modern dan siap untuk serverless.
- **Mesin Penyimpanan Data Hibrida (Zero-Config Fallback)**:
  - **In-Memory Mode**: Jika database tidak dikonfigurasi, aplikasi akan berjalan secara instan menggunakan penyimpanan in-memory (RAM) lokal yang sudah dimuat dengan data dummy film dan akun uji coba. Sangat cocok untuk pratinjau lokal!
  - **Prisma Database Mode**: Ketika `DATABASE_URL` ditambahkan di file `.env`, aplikasi akan secara otomatis beralih menggunakan database asli. Kompatibel dengan **Supabase**, **MongoDB**, dan **PostgreSQL**.
- **Stateful Multi-User Space**: Keamanan autentikasi menggunakan cookie sesi HTTP-only yang aman. Memungkinkan banyak pengguna login secara mandiri, membuat profil terpisah, menyimpan daftar favorit, riwayat tontonan, dan menulis ulasan film.
- **Tailwind CSS v4 & Motion**: Animasi yang mulus dan didukung akselerasi perangkat keras (`fadeInScale`, `slideUpText`) untuk menghadirkan pengalaman streaming premium kelas dunia.
- **Storage Agnostic**: Putar berkas film dari penyimpanan awan mana saja seperti Amazon S3, Cloudflare R2, BunnyCDN, Google Cloud Storage, atau tautan video publik lainnya dengan menyalin URL-nya di Admin CMS.

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
│   │   ├── in-memory-db.ts    # Database Mock/In-Memory global
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
   Buat berkas `.env` di folder root proyek dan masukkan string koneksi tersebut:
   ```env
   DATABASE_URL="postgresql://postgres.[username]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   TMDB_API_KEY="kunci_api_tmdb_anda" # Opsional
   ```
3. **Migrasikan Struktur Tabel**:
   Jalankan perintah berikut untuk mengunggah skema tabel ke database Supabase Anda:
   ```bash
   npx prisma db push
   ```
4. **Selesai!**:
   Kini ketika Anda menjalankan `npm run dev` atau mendeploy aplikasi, sistem MyStreamFlix akan membaca dan menulis data langsung ke Supabase Anda.

---

### Opsi B: PostgreSQL Umum
Dapat digunakan untuk Amazon RDS, DigitalOcean Databases, Render, atau database lokal PostgreSQL di PC Anda.

1. **Konfigurasi `.env`**:
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
   - `TMDB_API_KEY` : (Opsional, untuk mengambil data otomatis dari TMDB)
5. Klik **Deploy**! Vercel akan otomatis melakukan kompilasi aplikasi Next.js dan meluncurkan endpoint API serverless Anda.

> [!WARNING]
> Ketika dideploy ke Vercel, **Anda wajib mengkonfigurasi database asli**. Mode In-Memory bersifat sementara (volatil) dan akan terhapus secara acak ketika serverless container dibersihkan oleh Vercel.

---

## 🛡️ Informasi Akun Pengujian Default

Gunakan kredensial berikut untuk masuk saat aplikasi berjalan dalam **Mode In-Memory**:
- **Administrator**: Email `admin@streamcms.com` / Sandi: `admin`
- **Demo Viewer**: Email `demo@viewer.com` / Sandi: `demo`

*(Catatan: Saat database terhubung pertama kali, kedua akun pengujian ini akan otomatis dibuat pada database Anda agar sistem siap digunakan).*

---

## 📄 Lisensi & Ketentuan Distribusi

Pembelian produk ini memberikan Anda hak lisensi personal atau komersial:
- **Lisensi Personal**: Boleh digunakan pada perangkat pribadi untuk pembelajaran, modifikasi, atau keperluan hobi. Dilarang keras mendistribusikan ulang atau menjual kembali kode sumber ini di platform publik.
- **Lisensi Komersial**: Boleh diubah mereknya (rebrand), dimodifikasi, dan diluncurkan sebagai portal komersial untuk klien Anda.
