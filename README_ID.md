<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/PayPal-Subscriptions-003087?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal" />
  <img src="https://img.shields.io/badge/Lisensi-Proprietary-red?style=for-the-badge" alt="License" />
</p>

# 🎬 MyStreamFlix

### Boilerplate Premium Video-on-Demand (VoD) Sinematik & SaaS CMS

> **Luncurkan portal streaming sinematik Anda sendiri yang indah dan siap serverless dalam waktu kurang dari 5 menit.**

MyStreamFlix adalah platform streaming full-stack siap produksi yang dibangun dengan **Next.js 15**, **React 19**, **Prisma ORM**, dan **Tailwind CSS v4**. Dilengkapi tema gelap sinematik premium, pemutar video canggih, CMS admin lengkap, pembayaran langganan Stripe & PayPal, dan mesin data hibrida zero-config — semuanya bisa di-deploy ke **Vercel** dengan satu klik.

---

## ⚡ Arsitektur

| Fitur | Detail |
|---|---|
| **Framework** | Next.js 15 App Router (serverless-ready) |
| **Frontend** | React 19 + TypeScript 5.8 |
| **Styling** | Tailwind CSS v4 + Motion (animasi akselerasi hardware) |
| **Database** | Prisma ORM — PostgreSQL, Supabase, MongoDB, Neon.tech |
| **Auth** | Cookie sesi dengan tanda tangan kriptografis HMAC SHA-256 |
| **Pembayaran** | Stripe SDK + PayPal Subscriptions (USD) |
| **i18n** | Inggris, Indonesia, Spanyol (3 bahasa) |
| **Penyimpanan** | Storage-agnostic: S3, Cloudflare R2, BunnyCDN, GCS, atau URL publik |

### Mesin Data Hibrida (Smart Fallback Zero-Config)

```
┌──────────────────────────────────────────────────────────────┐
│                    Mesin MyStreamFlix                         │
│                                                              │
│  DATABASE_URL disetel?                                       │
│  ├── TIDAK → Mode In-Memory (instan, tanpa setup)           │
│  └── YA    → Mode Database                                  │
│              ├── 0 film?  → Tampilkan 100 film dummy        │
│              ├── 0 user?  → Muat akun demo bawaan           │
│              └── Ada data → Gunakan database sepenuhnya     │
└──────────────────────────────────────────────────────────────┘
```

- **Mode In-Memory**: Tanpa database. Langsung berjalan dengan konten bawaan. Sempurna untuk pratinjau lokal dan demo.
- **Mode Database**: Ketika `DATABASE_URL` dikonfigurasi, otomatis beralih ke penyimpanan persisten dengan fallback cerdas untuk tabel kosong.
- **Fallback Admin**: Akun admin bawaan (`admin@streamcms.com`) tetap dapat diakses melalui fallback aman meskipun user lain sudah ada di database.

---

## 🚀 Fitur Unggulan

### 🎥 Pemutar Video Fullscreen Canggih
- **Scoped Fullscreen**: Hanya panel video yang membesar (sidebar episode disembunyikan) untuk pengalaman imersif
- **Kontrol HUD Kustom**: Play/Pause, kecepatan putar, volume, bisukan, slider progres, dan tombol tutup
- **Sinkronisasi Keyboard**: Status fullscreen otomatis tersinkronisasi saat keluar via tombol Escape
- **Subtitle Multi-Bahasa**: Overlay subtitle interaktif dalam EN, ID, ES, FR
- **Fallback Sinematik**: Jika stream gagal, otomatis beralih ke simulasi bioskop atmosferik dengan kontrol yang berfungsi

### 🛠️ Admin CMS & Manajemen Katalog
- **CRUD Lengkap**: Buat, edit, dan hapus film serta serial TV dengan metadata lengkap
- **Integrator TMDB**: Cari dan impor otomatis metadata film (poster, backdrop, pemain, genre, musim/episode) langsung dari The Movie Database
- **TV Series Builder**: Kontrol input dinamis untuk musim, episode, tautan video, dan durasi kustom
- **Sortir Lanjutan**: Berdasarkan Baru Ditambahkan, Judul (A-Z/Z-A), Tahun Rilis, Popularitas
- **Filter Konten**: Pencarian real-time dan filter berdasarkan tipe konten (Film vs Serial TV)
- **Tabel Teroptimasi**: Header sticky dengan scroll vertikal untuk katalog besar

### 📊 Dasbor Analitik Real-Time
- **Metrik Utama**: Total judul, akumulasi tayangan, suka, pemirsa aktif (24 jam), jam tonton, pendapatan bulanan
- **Grafik Visual**: Grafik tren tayangan, diagram donat SVG Genre Populer
- **Pemecahan Demografis**: Profil Dewasa vs Anak, Pelanggan Gratis vs Premium (progress bar langsung)
- **Pendapatan Otomatis**: Dihitung ulang secara dinamis berdasarkan jumlah pengguna premium

### 👥 Sistem Multi-User & Profil
- **Sesi Aman**: Cookie bertanda tangan HMAC SHA-256 mencegah pembajakan sesi
- **Multi-Profil**: Hingga 5 profil per akun (termasuk mode Anak dengan batasan usia)
- **Personalisasi**: Favorit/watchlist, riwayat tonton dengan resume progress, riwayat ulasan
- **Akses Berbasis Peran**: Admin (CMS + dasbor penuh) dan User (penonton)
- **Manajemen Pengguna**: Admin dapat mempromosikan pengguna ke admin atau menghapus akun

### 💳 Pembayaran Langganan (Stripe & PayPal)
- **Stripe Checkout**: Pembayaran kartu kredit/debit via SDK Stripe resmi
- **PayPal Subscriptions**: Checkout ekspres dan penagihan berulang
- **Tiga Paket**: VIP ($2.99/bln), Premium ($5.99/bln), Ultra ($8.99/bln)
- **Handler Webhook**: Pemrosesan pembayaran async yang aman dengan upgrade akun otomatis
- **Mode Sandbox**: Mendeteksi otomatis API key kosong dan beralih ke checkout simulasi interaktif

### 🌍 Internasionalisasi (i18n)
- **3 Bahasa**: Inggris, Indonesia, Spanyol
- **Cakupan Penuh**: Semua string UI, label form, pesan error, dan kontrol CMS
- **Mudah Diperluas**: Satu file `translations.ts` — tambah bahasa baru dengan menyalin struktur yang ada

### 🎨 UI/UX Premium
- **Tema Gelap Sinematik**: Antarmuka gelap premium terinspirasi Netflix
- **Animasi Halus**: Transisi `fadeInScale` dan `slideUpText` dengan akselerasi hardware
- **Desain Responsif**: Dioptimalkan untuk desktop, tablet, dan mobile
- **Footer Interaktif**: Langganan newsletter, tautan sosial, navigasi, hak cipta

---

## 📂 Struktur Proyek

```
MyStreamFlix/
├── app/                          # Next.js App Router
│   ├── api/                      # 30 Rute API REST Serverless
│   │   ├── auth/                 #   Login, Registrasi, Logout, Profil, Peran
│   │   ├── movies/               #   CRUD, Ulasan
│   │   ├── subscription/         #   Stripe & PayPal Checkout + Webhook
│   │   ├── tmdb/                 #   Pencarian & Impor Metadata
│   │   ├── user/                 #   Favorit, Riwayat Tonton
│   │   ├── users/                #   Manajemen User (Admin)
│   │   ├── dashboard/            #   Statistik Analitik
│   │   ├── search/               #   Saran Pencarian
│   │   ├── settings/             #   Pengaturan CMS
│   │   └── subtitles/            #   File Subtitle
│   ├── globals.css               # Konfigurasi Tema Tailwind v4
│   ├── layout.tsx                # Layout Root dengan Metadata
│   └── page.tsx                  # Titik Masuk Klien
├── src/
│   ├── components/               # 11 Komponen React
│   │   ├── AdminCMS.tsx          #   Dasbor Admin & CMS Lengkap
│   │   ├── MediaPlayer.tsx       #   Pemutar Video Canggih
│   │   ├── Header.tsx            #   Navigasi & Auth
│   │   ├── Footer.tsx            #   Footer Premium
│   │   ├── MovieCard.tsx         #   Kartu Grid Film
│   │   ├── MovieCarousel.tsx     #   Korsel Banner Utama
│   │   ├── MovieDetailModal.tsx  #   Info Film & Ulasan
│   │   ├── MovieRow.tsx          #   Baris Scroll Horizontal
│   │   ├── AuthModal.tsx         #   Modal Login/Registrasi
│   │   ├── ProfileModal.tsx      #   Manajer Profil
│   │   └── SubscriptionModal.tsx #   Pemilihan Paket & Pembayaran
│   ├── lib/
│   │   ├── data-service.ts       #   Lapisan Akses Data Hibrida (DAL)
│   │   ├── db.ts                 #   Instantiator Prisma Client
│   │   ├── in-memory-db.ts       #   Penyimpanan In-Memory Global
│   │   ├── session.ts            #   Manajemen Sesi Cookie
│   │   ├── tmdb.ts               #   Klien API TMDB
│   │   └── dummy-movies.json     #   100 Film Sampel Bawaan
│   ├── App.tsx                   # Orkestrator Aplikasi Utama
│   ├── types.ts                  # Interface TypeScript
│   └── translations.ts           # Kamus i18n (EN/ID/ES)
├── prisma/
│   ├── schema.prisma             # Skema PostgreSQL Default
│   └── schema.mongodb.prisma     # Varian Skema MongoDB
├── scripts/
│   └── db-setup.js               # Inisialisasi & Seeding Database
├── public/
│   └── uploads/                  # Direktori Upload Lokal
├── .env.example                  # Template Variabel Lingkungan
├── .gitignore                    # Aturan Git Ignore
├── LICENSE                       # Perjanjian Lisensi Perangkat Lunak
├── CHANGELOG.md                  # Riwayat Versi
├── package.json                  # Dependensi & Skrip
├── tsconfig.json                 # Konfigurasi TypeScript
├── next.config.ts                # Konfigurasi Next.js
└── postcss.config.mjs            # Setup PostCSS / Tailwind
```

---

## 🛠️ Panduan Cepat (5 Menit)

### Prasyarat
- **Node.js** 18.x atau yang lebih baru
- **npm** (sudah termasuk bersama Node.js)

### Langkah 1: Ekstrak & Instal

```bash
# Ekstrak file ZIP, lalu masuk ke folder proyek
cd MyStreamFlix

# Instal semua dependensi
npm install
```

### Langkah 2: Konfigurasi Environment

```bash
# Salin file environment contoh
cp .env.example .env     # macOS/Linux
copy .env.example .env   # Windows
```

Edit `.env` dan konfigurasi variabel yang diperlukan (semua opsional untuk pengembangan lokal — aplikasi langsung berfungsi dengan nilai default).

### Langkah 3: Jalankan Secara Lokal

```bash
npm run dev
```

Buka **http://localhost:3000** — aplikasi langsung berjalan dalam **Mode In-Memory**!

### Akun Demo Bawaan

| Peran | Email | Password | Akses |
|---|---|---|---|
| **Admin** | `admin@streamcms.com` | `admin` | CMS & Dasbor Penuh |
| **Penonton** | `demo@viewer.com` | `demo` | Konten tier gratis |
| **Premium** | `premium@viewer.com` | `premium` | Katalog premium penuh |

---

## 🗄️ Setup Database (Opsional — Untuk Produksi)

Aplikasi berfungsi tanpa database, tetapi untuk deployment produksi Anda memerlukan penyimpanan persisten.

> [!IMPORTANT]
> Menjalankan `npm run db:setup` akan membuat skema tabel dan menanam **1 Akun Admin** (`admin@streamcms.com` / `admin`). Katalog film dimulai dalam keadaan kosong — isi melalui Admin CMS.

### Opsi A: Neon.tech (PostgreSQL) — *Direkomendasikan untuk Vercel*

1. Buat proyek di [neon.tech](https://neon.tech) dan salin Connection String
2. Setel di `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"
   ```
3. Inisialisasi:
   ```bash
   npm run db:setup
   ```

### Opsi B: Supabase (PostgreSQL)

1. Dapatkan connection string dari **Project Settings → Database**
2. Setel di `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
3. Inisialisasi:
   ```bash
   npm run db:setup
   ```

### Opsi C: PostgreSQL Generik

Kompatibel dengan Amazon RDS, DigitalOcean, Render, atau PostgreSQL lokal.

```env
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]"
```
```bash
npx prisma migrate dev --name init
```

### Opsi D: MongoDB Atlas

1. Ganti file skema:
   ```bash
   cp prisma/schema.mongodb.prisma prisma/schema.prisma       # macOS/Linux
   copy prisma\schema.mongodb.prisma prisma\schema.prisma     # Windows
   ```
2. Setel di `.env`:
   ```env
   DATABASE_URL="mongodb+srv://[user]:[password]@cluster.mongodb.net/mystreamflix?retryWrites=true&w=majority"
   ```
3. Dorong skema:
   ```bash
   npx prisma db push
   ```

---

## 🚀 Deploy ke Vercel

> [!WARNING]
> Saat men-deploy ke Vercel, **Anda harus menggunakan database sungguhan**. Mode in-memory akan ter-reset setiap kali serverless cold start terjadi.

### Checklist Deployment

```
1. Dapatkan DATABASE_URL dari Neon.tech atau Supabase
2. Setel DATABASE_URL di file .env lokal Anda
3. Jalankan: npm run db:setup (dari mesin lokal Anda)
4. Push kode ke GitHub
5. Impor repositori di Dashboard Vercel
6. Setel Environment Variables di Vercel (lihat tabel di bawah)
7. Deploy!
```

### Variabel Lingkungan untuk Vercel

| Variabel | Wajib | Deskripsi |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string database |
| `SESSION_SECRET` | ✅ | String acak untuk penandatanganan cookie. Buat dengan: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `TMDB_API_KEY` | ❌ | [TMDB API key](https://www.themoviedb.org/settings/api) untuk saran pencarian film |

---

## 💳 Setup Pembayaran (Stripe & PayPal)

Secara default, pembayaran berjalan dalam **Mode Sandbox** (checkout simulasi). Untuk menerima pembayaran USD sungguhan:

### Stripe (Kartu Kredit/Debit)

1. Dapatkan API key dari [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
2. Buat 3 produk bulanan berulang (VIP: $2.99, Premium: $5.99, Ultra: $8.99) dan salin Price ID
3. Buat Webhook endpoint yang mengarah ke `https://domainanda.com/api/subscription/webhook` (event: `checkout.session.completed`)
4. Tambahkan ke `.env`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_ID_VIP="price_..."
   STRIPE_PRICE_ID_PREMIUM="price_..."
   STRIPE_PRICE_ID_ULTRA="price_..."
   ```

### PayPal (PayPal Express & Langganan)

1. Buat Aplikasi Live di [PayPal Developer Portal](https://developer.paypal.com) → Apps & Credentials
2. Buat 3 Subscription Plans di portal bisnis PayPal Anda dan salin Plan ID
3. Buat Webhook yang mengarah ke `https://domainanda.com/api/subscription/paypal/webhook` (events: `BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`)
4. Tambahkan ke `.env`:
   ```env
   PAYPAL_CLIENT_ID="client_id_anda"
   PAYPAL_CLIENT_SECRET="secret_anda"
   PAYPAL_MODE="live"
   PAYPAL_PLAN_ID_VIP="p-..."
   PAYPAL_PLAN_ID_PREMIUM="p-..."
   PAYPAL_PLAN_ID_ULTRA="p-..."
   ```

---

## 🔧 Skrip yang Tersedia

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Jalankan server pengembangan di `http://localhost:3000` |
| `npm run build` | Buat Prisma client dan build untuk produksi |
| `npm start` | Jalankan server produksi |
| `npm run lint` | Jalankan linter Next.js |
| `npm run db:setup` | Dorong skema database + tanam akun admin & pengaturan CMS |
| `npm run package` | Buat file ZIP distribusi |

---

## 🔒 Referensi Variabel Lingkungan

| Variabel | Default | Deskripsi |
|---|---|---|
| `APP_URL` | — | URL publik tempat aplikasi di-host |
| `DATABASE_URL` | `placeholder` | Connection string database (PostgreSQL / MongoDB) |
| `SESSION_SECRET` | Kunci bawaan | Secret untuk penandatanganan cookie HMAC SHA-256 |
| `TMDB_API_KEY` | — | TMDB v3 API key untuk pencarian metadata film |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `placeholder` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | `placeholder` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `placeholder` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_VIP` | `placeholder` | Stripe Price ID untuk paket VIP |
| `STRIPE_PRICE_ID_PREMIUM` | `placeholder` | Stripe Price ID untuk paket Premium |
| `STRIPE_PRICE_ID_ULTRA` | `placeholder` | Stripe Price ID untuk paket Ultra |
| `PAYPAL_CLIENT_ID` | `placeholder` | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | `placeholder` | PayPal app secret |
| `PAYPAL_MODE` | `sandbox` | `sandbox` atau `live` |
| `PAYPAL_PLAN_ID_VIP` | `placeholder` | PayPal Plan ID untuk paket VIP |
| `PAYPAL_PLAN_ID_PREMIUM` | `placeholder` | PayPal Plan ID untuk paket Premium |
| `PAYPAL_PLAN_ID_ULTRA` | `placeholder` | PayPal Plan ID untuk paket Ultra |

---

## ❓ FAQ

<details>
<summary><strong>Apakah saya memerlukan database untuk menjalankan ini secara lokal?</strong></summary>
Tidak! MyStreamFlix langsung berjalan menggunakan mesin data in-memory dengan 100 film sampel bawaan. Tidak perlu setup database untuk pengembangan lokal atau demo.
</details>

<details>
<summary><strong>Database apa saja yang didukung?</strong></summary>
PostgreSQL (Neon.tech, Supabase, Amazon RDS, DigitalOcean, lokal), dan MongoDB Atlas. Proyek ini menyertakan file skema Prisma untuk keduanya.
</details>

<details>
<summary><strong>Bisakah saya mengganti branding dengan logo dan warna saya sendiri?</strong></summary>
Bisa! Ubah nama situs, teks logo, warna primer, dan pengaturan SEO langsung dari panel Admin CMS — tanpa perlu mengedit kode. Untuk kustomisasi lebih dalam, semua style menggunakan Tailwind CSS.
</details>

<details>
<summary><strong>Bagaimana pembayaran bekerja tanpa kunci Stripe/PayPal?</strong></summary>
Sistem mendeteksi otomatis API key kosong/placeholder dan beralih ke checkout kartu kredit simulasi interaktif. Ini memungkinkan Anda mendemonstrasikan alur pembayaran penuh tanpa akun pembayaran sungguhan.
</details>

<details>
<summary><strong>Bisakah saya menambahkan lebih banyak bahasa?</strong></summary>
Bisa. Buka <code>src/translations.ts</code> dan tambahkan objek bahasa baru mengikuti struktur EN/ID/ES yang sudah ada. Aplikasi akan otomatis menyertakannya di pengalih bahasa.
</details>

<details>
<summary><strong>Di mana saya harus meng-host video saya?</strong></summary>
MyStreamFlix bersifat storage-agnostic. Tempelkan URL video langsung (MP4, HLS) dari Amazon S3, Cloudflare R2, BunnyCDN, Google Cloud Storage, atau host file publik mana pun ke Admin CMS saat menambahkan film.
</details>

<details>
<summary><strong>Apa yang terjadi jika stream video gagal?</strong></summary>
Pemutar otomatis beralih ke simulasi bioskop atmosferik dengan kontrol pemutaran yang berfungsi, pengatur kecepatan, dan subtitle — memastikan pengunjung tidak pernah melihat layar rusak.
</details>

<details>
<summary><strong>Apakah ini pembelian satu kali?</strong></summary>
Ya. Anda membayar sekali dan menerima source code lengkap dengan akses seumur hidup. Tidak ada biaya berulang atau langganan.
</details>

---

## 🛡️ Teknologi yang Digunakan

| Lapisan | Teknologi |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Next.js 15 (App Router) |
| **Pustaka UI** | React 19 |
| **Bahasa** | TypeScript 5.8 |
| **Styling** | Tailwind CSS v4 + Motion |
| **Database ORM** | Prisma 6 |
| **Pembayaran** | Stripe SDK + PayPal REST API |
| **Auth** | Cookie HTTP-only bertanda tangan HMAC SHA-256 |
| **Ikon** | Lucide React |
| **Deployment** | Vercel (teroptimasi) |

---

## 📄 Lisensi

Perangkat lunak ini didistribusikan di bawah **Lisensi Proprietary**. Lihat [LICENSE](./LICENSE) untuk detail lengkap.

| Tier Lisensi | Penggunaan | Harga |
|---|---|---|
| **Personal** | Pembelajaran, portofolio, media hub pribadi | $24.99 – $29.99 |
| **Komersial** | Proyek klien, portal streaming komersial | $79.00 – $99.00 |

**Redistribusi, penjualan kembali, atau berbagi publik source code dilarang keras.**

---

<p align="center">
  <strong>MyStreamFlix v1.0.0</strong> — Dibangun dengan ❤️ menggunakan Next.js 15, React 19, dan Prisma ORM
</p>
