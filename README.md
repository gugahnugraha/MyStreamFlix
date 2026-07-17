<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/PayPal-Subscriptions-003087?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License" />
</p>

# 🎬 MyStreamFlix

### Premium Cinematic Video-on-Demand (VoD) & CMS SaaS Boilerplate

> **Launch your own beautifully designed, serverless-ready cinematic streaming portal in under 5 minutes.**

MyStreamFlix is a production-ready, full-stack streaming platform and content management system built with **Next.js 15**, **React 19**, **Prisma ORM**, and **Tailwind CSS v4**. It features a premium dark cinematic theme, an advanced video player, a complete admin CMS, Stripe & PayPal subscription payments, and a hybrid zero-config data engine — all deployable to **Vercel** with one click.

---

## ⚡ Architecture Highlights

| Feature | Detail |
|---|---|
| **Framework** | Next.js 15 App Router (serverless-ready) |
| **Frontend** | React 19 + TypeScript 5.8 |
| **Styling** | Tailwind CSS v4 + Motion (hardware-accelerated animations) |
| **Database** | Prisma ORM — PostgreSQL, Supabase, MongoDB, Neon.tech |
| **Auth** | HMAC SHA-256 cryptographically signed cookies |
| **Payments** | Stripe SDK + PayPal Subscriptions (USD) |
| **I18n** | English, Indonesian, Spanish (3 languages) |
| **Storage** | Storage-agnostic: S3, Cloudflare R2, BunnyCDN, GCS, or any public URL |

### Hybrid Data Engine (Zero-Config Smart Fallback)

```
┌──────────────────────────────────────────────────────────────┐
│                    MyStreamFlix Engine                        │
│                                                              │
│  DATABASE_URL set?                                           │
│  ├── NO  → In-Memory Mode (instant, zero-setup)             │
│  └── YES → Database Mode                                    │
│            ├── 0 movies? → Show 100 dummy movies fallback   │
│            ├── 0 users?  → Load default demo accounts       │
│            └── Data exists → Use database exclusively       │
└──────────────────────────────────────────────────────────────┘
```

- **In-Memory Mode**: No database needed. Runs instantly out-of-the-box with pre-loaded content. Perfect for local previews and demos.
- **Database Mode**: When `DATABASE_URL` is configured, automatically switches to persistent storage with smart fallbacks for empty tables.
- **Admin Fallback**: The default admin account (`admin@streamcms.com`) remains accessible via secure fallback even when other users exist in the database.

---

## 🚀 Features

### 🎥 Advanced Fullscreen Video Player
- **Scoped Fullscreen**: Expands only the video panel (hides episode sidebar) for immersive playback
- **Custom HUD Controls**: Play/Pause, playback speed, volume, mute, progress scrubbing, and close
- **Keyboard Sync**: Auto-syncs fullscreen state when exiting via Escape key
- **Multi-Language Subtitles**: Interactive subtitle overlay in EN, ID, ES, FR
- **Cinema Fallback**: If a stream fails, transitions into an atmospheric cinema simulation with working controls

### 🛠️ Admin CMS & Catalog Management
- **Full CRUD**: Create, edit, and delete movies and TV series with rich metadata
- **TMDB Integrator**: Search and auto-import movie metadata (posters, backdrops, cast, genres, seasons/episodes) directly from The Movie Database
- **TV Series Builder**: Dynamic input controls for seasons, episodes, video links, and custom runtimes
- **Advanced Sorting**: By Recently Added, Title (A-Z/Z-A), Release Year, Popularity
- **Content Filtering**: Real-time search and filter by content type (Movies vs TV Series)
- **Optimized Table**: Sticky header with vertical scroll for large catalogs

### 📊 Real-Time Analytics Dashboard
- **Key Metrics**: Total titles, aggregated views, likes, active watchers (24h), watch hours, monthly revenue
- **Visual Charts**: Views trend graph, Top Genres SVG donut chart
- **Demographic Splits**: Adult vs Kids profiles, Free vs Premium subscribers (live progress bars)
- **Auto-Calculated Revenue**: Dynamically recalculated based on premium user count

### 👥 Multi-User & Profile System
- **Secure Sessions**: HMAC SHA-256 signed cookies preventing session hijacking
- **Multi-Profile**: Up to 5 profiles per account (including age-gated Kids mode)
- **Personalization**: Favorites/watchlist, watch history with resume progress, review history
- **Role-Based Access**: Admin (full CMS + dashboard) and User (viewer) roles
- **User Management**: Admins can promote users to admin or remove accounts

### 💳 Subscription Payments (Stripe & PayPal)
- **Stripe Checkout**: Credit/debit card payments via official Stripe SDK
- **PayPal Subscriptions**: Express checkout and recurring billing
- **Three Tiers**: VIP ($2.99/mo), Premium ($5.99/mo), Ultra ($8.99/mo)
- **Webhook Handlers**: Secure async payment processing with auto account upgrades
- **Sandbox Mode**: Auto-detects empty API keys and falls back to interactive simulated checkout

### 🌍 Internationalization (i18n)
- **3 Languages**: English, Indonesian, Spanish
- **Full Coverage**: All UI strings, form labels, error messages, and CMS controls
- **Easy to Extend**: Single `translations.ts` file — add new languages by copying the existing structure

### 🎨 Premium UI/UX
- **Dark Cinematic Theme**: Netflix-inspired premium dark interface
- **Fluid Animations**: Hardware-accelerated `fadeInScale` and `slideUpText` transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Interactive Footer**: Newsletter subscription, social links, navigation, copyright

---

## 📂 Project Structure

```
MyStreamFlix/
├── app/                          # Next.js App Router
│   ├── api/                      # 30 Serverless REST API Routes
│   │   ├── auth/                 #   Login, Register, Logout, Profiles, Roles
│   │   ├── movies/               #   CRUD, Reviews
│   │   ├── subscription/         #   Stripe & PayPal Checkout + Webhooks
│   │   ├── tmdb/                 #   Search & Metadata Import
│   │   ├── user/                 #   Favorites, Watch History
│   │   ├── users/                #   User Management (Admin)
│   │   ├── dashboard/            #   Analytics Stats
│   │   ├── search/               #   Suggestions
│   │   ├── settings/             #   CMS Settings
│   │   └── subtitles/            #   Subtitle Files
│   ├── globals.css               # Tailwind v4 Theme Configuration
│   ├── layout.tsx                # Root Layout with Metadata
│   └── page.tsx                  # Client Entrypoint
├── src/
│   ├── components/               # 11 React Components
│   │   ├── AdminCMS.tsx          #   Full Admin Dashboard & CMS
│   │   ├── MediaPlayer.tsx       #   Advanced Video Player
│   │   ├── Header.tsx            #   Navigation & Auth
│   │   ├── Footer.tsx            #   Premium Footer
│   │   ├── MovieCard.tsx         #   Movie Grid Card
│   │   ├── MovieCarousel.tsx     #   Hero Banner Carousel
│   │   ├── MovieDetailModal.tsx  #   Movie Info & Reviews
│   │   ├── MovieRow.tsx          #   Horizontal Scroll Row
│   │   ├── AuthModal.tsx         #   Login/Register Modal
│   │   ├── ProfileModal.tsx      #   Profile Manager
│   │   └── SubscriptionModal.tsx #   Payment & Plan Selection
│   ├── lib/
│   │   ├── data-service.ts       #   Hybrid Data Access Layer (DAL)
│   │   ├── db.ts                 #   Prisma Client Instantiator
│   │   ├── in-memory-db.ts       #   Global In-Memory Store
│   │   ├── session.ts            #   Cookie Session Management
│   │   ├── tmdb.ts               #   TMDB API Client
│   │   └── dummy-movies.json     #   100 Pre-loaded Sample Movies
│   ├── App.tsx                   # Main Application Orchestrator
│   ├── types.ts                  # TypeScript Interfaces
│   └── translations.ts           # i18n Dictionary (EN/ID/ES)
├── prisma/
│   ├── schema.prisma             # Default PostgreSQL Schema
│   └── schema.mongodb.prisma     # MongoDB Schema Variant
├── scripts/
│   └── db-setup.js               # Database Initialization & Seeding
├── public/
│   └── uploads/                  # Local Upload Directory
├── .env.example                  # Environment Variables Template
├── .gitignore                    # Git Ignore Rules
├── LICENSE                       # Software License Agreement
├── CHANGELOG.md                  # Version History
├── package.json                  # Dependencies & Scripts
├── tsconfig.json                 # TypeScript Configuration
├── next.config.ts                # Next.js Configuration
└── postcss.config.mjs            # PostCSS / Tailwind Setup
```

---

## 🛠️ Quick Start (5 Minutes)

### Prerequisites
- **Node.js** 18.x or above
- **npm** (comes with Node.js)

### Step 1: Extract & Install

```bash
# Extract the ZIP file, then navigate to the project folder
cd MyStreamFlix

# Install all dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env     # macOS/Linux
copy .env.example .env   # Windows
```

Edit `.env` and configure the variables you need (all are optional for local development — the app works out of the box with defaults).

### Step 3: Run Locally

```bash
npm run dev
```

Open **http://localhost:3000** — the app runs immediately in **In-Memory Mode**!

### Default Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@streamcms.com` | `admin` | Full CMS & Dashboard |
| **Viewer** | `demo@viewer.com` | `demo` | Free tier content |
| **Premium** | `premium@viewer.com` | `premium` | Full premium catalog |

---

## 🗄️ Database Setup (Optional — For Production)

The app works without a database, but for production deployment you'll want persistent storage.

> [!IMPORTANT]
> Running `npm run db:setup` pushes the table schema and seeds **1 Admin Account** (`admin@streamcms.com` / `admin`). The movie catalog starts empty — populate it via the Admin CMS.

### Option A: Neon.tech (PostgreSQL) — *Recommended for Vercel*

1. Create a project on [neon.tech](https://neon.tech) and copy the Connection String
2. Set in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"
   ```
3. Initialize:
   ```bash
   npm run db:setup
   ```

### Option B: Supabase (PostgreSQL)

1. Get the connection string from **Project Settings → Database**
2. Set in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
3. Initialize:
   ```bash
   npm run db:setup
   ```

### Option C: Generic PostgreSQL

Works with Amazon RDS, DigitalOcean, Render, or local PostgreSQL.

```env
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]"
```
```bash
npx prisma migrate dev --name init
```

### Option D: MongoDB Atlas

1. Replace the schema file:
   ```bash
   cp prisma/schema.mongodb.prisma prisma/schema.prisma       # macOS/Linux
   copy prisma\schema.mongodb.prisma prisma\schema.prisma     # Windows
   ```
2. Set in `.env`:
   ```env
   DATABASE_URL="mongodb+srv://[user]:[password]@cluster.mongodb.net/mystreamflix?retryWrites=true&w=majority"
   ```
3. Push schema:
   ```bash
   npx prisma db push
   ```

---

## 🚀 Deploying to Vercel

> [!WARNING]
> When deploying to Vercel, **you must use a real database**. In-memory mode resets on every serverless cold start.

### Deployment Checklist

```
1. Get DATABASE_URL from Neon.tech or Supabase
2. Set DATABASE_URL in your local .env
3. Run: npm run db:setup (from your local machine)
4. Push code to GitHub
5. Import repository in Vercel Dashboard
6. Set Environment Variables in Vercel (see table below)
7. Deploy!
```

### Environment Variables for Vercel

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Database connection string |
| `SESSION_SECRET` | ✅ | Random string for cookie signing. Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `TMDB_API_KEY` | ❌ | [TMDB API key](https://www.themoviedb.org/settings/api) for movie search suggestions |

---

## 💳 Payment Setup (Stripe & PayPal)

By default, payments run in **Sandbox Mode** (simulated checkout). To accept real USD payments:

### Stripe (Credit/Debit Cards)

1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
2. Create 3 recurring monthly products (VIP: $2.99, Premium: $5.99, Ultra: $8.99) and copy Price IDs
3. Create a Webhook endpoint pointing to `https://yourdomain.com/api/subscription/webhook` (event: `checkout.session.completed`)
4. Add to `.env`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_ID_VIP="price_..."
   STRIPE_PRICE_ID_PREMIUM="price_..."
   STRIPE_PRICE_ID_ULTRA="price_..."
   ```

### PayPal (PayPal Express & Subscriptions)

1. Create a Live App in [PayPal Developer Portal](https://developer.paypal.com) → Apps & Credentials
2. Create 3 Subscription Plans in your PayPal Business portal and copy Plan IDs
3. Create a Webhook pointing to `https://yourdomain.com/api/subscription/paypal/webhook` (events: `BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`)
4. Add to `.env`:
   ```env
   PAYPAL_CLIENT_ID="your_client_id"
   PAYPAL_CLIENT_SECRET="your_secret"
   PAYPAL_MODE="live"
   PAYPAL_PLAN_ID_VIP="p-..."
   PAYPAL_PLAN_ID_PREMIUM="p-..."
   PAYPAL_PLAN_ID_ULTRA="p-..."
   ```

---

## 🔧 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run build` | Generate Prisma client and build for production |
| `npm start` | Start production server |
| `npm run lint` | Run Next.js linter |
| `npm run db:setup` | Push database schema + seed admin account & CMS settings |
| `npm run package` | Create distribution ZIP file |

---

## 🔒 Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `APP_URL` | — | Public URL where the app is hosted |
| `DATABASE_URL` | `placeholder` | Database connection string (PostgreSQL / MongoDB) |
| `SESSION_SECRET` | Built-in key | Secret for HMAC SHA-256 cookie signing |
| `TMDB_API_KEY` | — | TMDB v3 API key for movie metadata search |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `placeholder` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | `placeholder` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `placeholder` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_VIP` | `placeholder` | Stripe Price ID for VIP tier |
| `STRIPE_PRICE_ID_PREMIUM` | `placeholder` | Stripe Price ID for Premium tier |
| `STRIPE_PRICE_ID_ULTRA` | `placeholder` | Stripe Price ID for Ultra tier |
| `PAYPAL_CLIENT_ID` | `placeholder` | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | `placeholder` | PayPal app secret |
| `PAYPAL_MODE` | `sandbox` | `sandbox` or `live` |
| `PAYPAL_PLAN_ID_VIP` | `placeholder` | PayPal Plan ID for VIP tier |
| `PAYPAL_PLAN_ID_PREMIUM` | `placeholder` | PayPal Plan ID for Premium tier |
| `PAYPAL_PLAN_ID_ULTRA` | `placeholder` | PayPal Plan ID for Ultra tier |

---

## ❓ FAQ

<details>
<summary><strong>Do I need a database to run this locally?</strong></summary>
No! MyStreamFlix runs instantly out-of-the-box using an in-memory data engine with 100 pre-loaded sample movies. No database setup required for local development or demos.
</details>

<details>
<summary><strong>Which databases are supported?</strong></summary>
PostgreSQL (Neon.tech, Supabase, Amazon RDS, DigitalOcean, local), and MongoDB Atlas. The project includes Prisma schema files for both.
</details>

<details>
<summary><strong>Can I rebrand this with my own logo and colors?</strong></summary>
Yes! Change the site name, logo text, primary color, and SEO settings directly from the Admin CMS panel — no code editing needed. For deeper customization, all styles use Tailwind CSS.
</details>

<details>
<summary><strong>How do payments work without Stripe/PayPal keys?</strong></summary>
The system auto-detects empty/placeholder API keys and falls back to an interactive simulated credit card checkout. This lets you demo the full payment flow without any real payment accounts.
</details>

<details>
<summary><strong>Can I add more languages?</strong></summary>
Yes. Open <code>src/translations.ts</code> and add a new language object following the existing EN/ID/ES structure. The app will automatically include it in the language switcher.
</details>

<details>
<summary><strong>Where do I host my videos?</strong></summary>
MyStreamFlix is storage-agnostic. Paste any direct video URL (MP4, HLS) from Amazon S3, Cloudflare R2, BunnyCDN, Google Cloud Storage, or any public file host into the Admin CMS when adding a movie.
</details>

<details>
<summary><strong>What happens if a video stream fails?</strong></summary>
The player automatically transitions into an atmospheric cinema simulation with working playback controls, speed adjustment, and subtitles — ensuring visitors never see a broken screen.
</details>

<details>
<summary><strong>Is this a one-time purchase?</strong></summary>
Yes. You pay once and receive the full source code with lifetime access. No recurring fees or subscriptions.
</details>

---

## 🛡️ Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5.8 |
| **Styling** | Tailwind CSS v4 + Motion |
| **Database ORM** | Prisma 6 |
| **Payments** | Stripe SDK + PayPal REST API |
| **Auth** | HMAC SHA-256 signed HTTP-only cookies |
| **Icons** | Lucide React |
| **Deployment** | Vercel (optimized) |

---

## 📄 License

This software is distributed under a **Proprietary License**. See [LICENSE](./LICENSE) for full details.

| License Tier | Use Case | Price |
|---|---|---|
| **Personal** | Learning, portfolios, personal media hubs | $24.99 – $29.99 |
| **Commercial** | Client projects, commercial streaming portals | $79.00 – $99.00 |

**Redistribution, resale, or public sharing of the source code is strictly prohibited.**

---

<p align="center">
  <strong>MyStreamFlix v1.0.0</strong> — Built with ❤️ using Next.js 15, React 19, and Prisma ORM
</p>
