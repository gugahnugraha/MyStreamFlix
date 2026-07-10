# 🎬 MyStreamFlix - Premium Cinematic Video-on-Demand (VoD) & CMS SaaS Framework

MyStreamFlix is a high-performance, beautiful, full-stack streaming portal and SaaS template designed with a premium, sleek dark user interface. Built with **Next.js 15 (App Router)** and **Prisma ORM**, it is optimized for developers looking to launch their own streaming platform, video library, course site, or digital media store on Vercel.

It features a gorgeous cinematic player, robust comment boards, real-time analytics dashboards, and a complete administrative CMS.

---

## ⚡ Key Highlights & Architecture

- **Modern Next.js 15 Stack**: Designed with a serverless-ready Next.js App Router architecture for optimized performance.
- **Hybrid Data Storage Engine (Zero-Config Fallback)**:
  - **In-Memory Mode**: If no database is configured, the application runs instantly out-of-the-box using an in-memory data store. Perfect for local previews or zero-setup deployments!
  - **Prisma Database Mode**: When a `DATABASE_URL` is supplied, the app automatically switches to database persistence. Compatible with **Supabase**, **MongoDB**, and **PostgreSQL**.
- **Stateful Multi-User Space & Secure Sessions**:
  - **Cryptographically Signed Cookies (HMAC SHA-256)**: Implements secure cookie verification preventing session hijacking or client-side user ID tampering.
  - **Session Persistence**: Sessions are robustly cached and persisted globally across Hot Module Replacement (HMR) reloads and browser refreshes.
  - **Personalization**: Allows users to manage multiple profiles (including Kids zones), maintain personalized favorites/watchlists, watch histories, and review logs.
- **Tailwind CSS v4 & Motion**: Sleek, hardware-accelerated animations (`fadeInScale`, `slideUpText`) for that smooth, premium streaming experience.
- **Storage Agnostic**: Stream video directly via secure URLs from Amazon S3, Cloudflare R2, BunnyCDN, Google Cloud Storage, or simple public drives.

---

## 🚀 Key Features Built-In

### 1. Advanced Fullscreen Video Player
- **Scoped Fullscreen Experience**: Pressing the fullscreen button expands only the video screen panel (hiding the TV Series episodes/seasons sidebar) for an immersive experience.
- **Custom HUD Control Overlays**: Includes dynamic Play/Pause toggle, playback speed controller, volume levels, mute toggle, progress scrubbing timeline, and close action.
- **Event-Driven Synchronization**: Auto-syncs fullscreen states (updating Maximize/Minimize icons) dynamically when exiting using standard escape keys.
- **Multi-Language Subtitles**: Mock subtitle overlay supporting English, Indonesian, Spanish, and French.

### 2. Administrative CMS & Catalog CRUD
- **Advanced Sorting**: Sort the movie catalog by Recently Added, Title (A-Z/Z-A), Release Year (Newest/Oldest), and Popularity (Views/Likes).
- **Aesthetic Search & Filtering**: Real-time filtering by content type (Movies vs TV Series) and text search (title, genres, director, cast).
- **Optimized Catalog Table**: Features a vertical scrollbar with a sticky header wrapper (`max-h-[550px]`) for seamless navigation through large databases.
- **TV Series Builder**: Dynamic input controls for seasons, episodes, video links, and custom runtimes.
- **Overview Analytics**: Visual stats tracker counting total titles, aggregated views, likes, and premium tier ratios.

---

## 📂 Folder Structure

```text
├── prisma/
│   ├── schema.prisma          # Default SQL (Supabase/PostgreSQL) Schema
│   └── schema.mongodb.prisma  # MongoDB Schema Variant
├── app/                       # Next.js App Router (pages and API routes)
│   ├── api/                   # Serverless REST endpoints
│   ├── layout.tsx             # Root page wrapper and font imports
│   ├── page.tsx               # Client orchestrator entrypoint
│   └── globals.css            # Stylesheet (Tailwind v4 theme configurations)
├── src/
│   ├── components/            # UI Components (Header, MediaPlayer, AdminCMS, etc.)
│   ├── lib/                   # Utilities, Session, Prisma, and In-Memory Stores
│   │   ├── db.ts              # Prisma Client Instantiator
│   │   ├── in-memory-db.ts    # Global Mock Data Store (persisted across reloads)
│   │   ├── data-service.ts    # Unified Hybrid Data Access Layer (DAL)
│   │   └── tmdb.ts            # TMDB suggestions provider
│   ├── types.ts               # Unified TypeScript Interfaces
│   └── translations.ts        # EN / ID / ES Localization dictionary
```

---

## 🛠️ Installation & Getting Started

### Prerequisites
Make sure you have:
- **Node.js** (Version 18.x or above)
- **npm** (comes packaged with Node)

### Step 1: Extract and Navigate
Navigate to the root directory of the application:
```bash
cd MyStreamFlix
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Locally (In-Memory Fallback)
Start the development server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.
The app will run automatically in **In-Memory Mode** since no `DATABASE_URL` is configured in `.env`. You can explore, log in as admin, create profiles, watch movies, and upload contents!

---

## 🗄️ Database Integration Guide (Supabase, PostgreSQL, MongoDB)

To persist user registrations, catalogs, and watch history permanently, connect a database using Prisma ORM.

### Option A: Supabase (PostgreSQL) - *Recommended*
Supabase provides a free, robust PostgreSQL database ideal for serverless deployments on Vercel.

1. **Get the connection string**:
   - Go to your Supabase project dashboard -> **Project Settings** -> **Database**.
   - Copy the **Transaction** connection string (usually starts with `postgres://...` or `postgresql://...`). Make sure to use the correct port (usually `6543` for connection pooling) and append `?pgbouncer=true`.
2. **Configure your `.env`**:
   Create a `.env` file in the root folder and add:
   ```env
   DATABASE_URL="postgresql://postgres.[username]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   SESSION_SECRET="your_custom_secure_session_secret_key" # Replace with a long random string
   TMDB_API_KEY="your_tmdb_key_here" # Optional
   ```
3. **Deploy Schema**:
   Run the Prisma migration tool to create the tables in Supabase:
   ```bash
   npx prisma db push
   ```
4. **Run Application**:
   Launch `npm run dev` to read/write directly to Supabase.

---

### Option B: Generic PostgreSQL
Works with Amazon RDS, DigitalOcean Databases, Render, or a local PostgreSQL instance.

1. **Configure `.env`**:
   ```env
   DATABASE_URL="postgresql://[username]:[password]@[host]:5432/[database_name]"
   ```
2. **Run Migrations**:
   Generate SQL migrations and apply them:
   ```bash
   npx prisma migrate dev --name init
   ```

---

### Option C: MongoDB (Atlas)
MongoDB is a flexible document database that works perfectly with MyStreamFlix.

1. **Prepare MongoDB Schema**:
   Because MongoDB has unique primary key rules (`_id` representation), replace the default schema with our pre-configured MongoDB schema:
   ```bash
   copy prisma\schema.mongodb.prisma prisma\schema.prisma
   ```
   *(On macOS/Linux: `cp prisma/schema.mongodb.prisma prisma/schema.prisma`)*
2. **Configure `.env`**:
   Get your MongoDB Connection URI from MongoDB Atlas (make sure database name is specified):
   ```env
   DATABASE_URL="mongodb+srv://[username]:[password]@cluster.mongodb.net/mystreamflix?retryWrites=true&w=majority"
   ```
3. **Generate Prisma Client**:
   Since MongoDB doesn't use relational migrations, simply push the schema structure:
   ```bash
   npx prisma db push
   ```

---

## 🚀 Deploying to Vercel

Next.js is built by Vercel, making the deployment process incredibly easy:

1. Push your code repository to **GitHub / GitLab / Bitbucket**.
2. Log into your [Vercel Dashboard](https://vercel.com).
3. Click **Add New** -> **Project** and import your repository.
4. Add the following **Environment Variables** in Vercel:
   - `DATABASE_URL` : (Your Supabase, PostgreSQL, or MongoDB connection string)
   - `SESSION_SECRET` : (A secure random string to cryptographically sign session cookies)
   - `TMDB_API_KEY` : (Optional, for movie suggestions)
5. Click **Deploy**! Vercel will automatically build the Next.js bundle and set up your serverless endpoints.

> [!WARNING]
> When deploying to Vercel, **you must use a real database**. In-memory mode is transient and will reset on cold starts due to the serverless container cycling architecture of Vercel.

---

## 💳 Payment Gateway Integration (Stripe & PayPal - USD Only)

MyStreamFlix has **Stripe** and **PayPal** subscription checkouts fully built into the codebase. 

By default, the application runs in **Sandbox Simulation mode** (allowing mock checkout testing). To transition your portal to accept real USD payments, the website owner only needs to drop their account details into the `.env` file:

### 1. Stripe Setup (Credit Cards)
1. **API Keys**: Go to your [Stripe Dashboard](https://dashboard.stripe.com) -> **Developers** -> **API Keys**.
2. **Copy Keys**: Copy your **Publishable key** and **Secret key** and paste them into `.env`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_yourStripeKey..."
   STRIPE_SECRET_KEY="sk_live_yourStripeSecret..."
   ```
3. **Subscription Products**: In Stripe Dashboard, create 3 recurring monthly products matching the pricing plans (VIP: `$2.99/mo`, Premium: `$5.99/mo`, Ultra: `$8.99/mo`). Copy their respective **Price IDs** (starting with `price_...`) and add them:
   ```env
   STRIPE_PRICE_ID_VIP="price_..."
   STRIPE_PRICE_ID_PREMIUM="price_..."
   STRIPE_PRICE_ID_ULTRA="price_..."
   ```
4. **Webhooks**: Go to Stripe -> **Developers** -> **Webhooks**. Click **Add endpoint** and point it to:
   `https://yourdomain.com/api/subscription/webhook`
   Select event: `checkout.session.completed`. Copy the generated **Signing secret** (`whsec_...`) and set it:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

### 2. PayPal Setup (PayPal Express/VA)
1. **API Keys**: Go to the [PayPal Developer Portal](https://developer.paypal.com) -> **Apps & Credentials**. Create a Live App.
2. **Copy Keys**: Copy your **Client ID** and **Secret Key** and paste them:
   ```env
   PAYPAL_CLIENT_ID="your_paypal_client_id"
   PAYPAL_CLIENT_SECRET="your_paypal_secret"
   PAYPAL_MODE="live" # Change from "sandbox" to "live"
   ```
3. **Billing Plans**: In your PayPal Business portal, go to **Subscriptions** -> **Create Plan** for the 3 tiers. Copy their **Plan IDs** (starting with `p-...`) and add them:
   ```env
   PAYPAL_PLAN_ID_VIP="p-..."
   PAYPAL_PLAN_ID_PREMIUM="p-..."
   PAYPAL_PLAN_ID_ULTRA="p-..."
   ```
4. **Webhooks**: Create a Webhook pointing to:
   `https://yourdomain.com/api/subscription/paypal/webhook`
   Enable events: `BILLING.SUBSCRIPTION.ACTIVATED` and `PAYMENT.SALE.COMPLETED`.

---

## 🛡️ Default Demo Accounts

When running in **In-Memory Mode**, use these credentials to log in and explore different roles:

| Role | Email | Password | Tier | Access |
|---|---|---|---|---|
| **Administrator** | `admin@streamcms.com` | `admin` | Premium VIP | Full CMS & Admin Dashboard |
| **Demo Viewer** | `demo@viewer.com` | `demo` | Free | Limited to free content |
| **Premium Viewer** | `premium@viewer.com` | `premium` | Premium VIP | Full premium catalog, no admin |

- **Admin** — has access to the full Admin CMS dashboard (movie catalog CRUD, analytics, site settings).
- **Demo Viewer** — standard free-tier user, can browse free content, manage profiles, and subscribe.
- **Premium Viewer** — subscriber-tier user with full premium catalog access, without admin privileges.

*(Note: In database mode, these default accounts will automatically be generated in your database during the first run).*

---

## 📄 License & Distribution Notes

Purchasing this product grants you a **Personal License** or **Commercial License** depending on your selection at checkout:
- **Personal License**: Allowed to run on your own devices for learning, modification, or personal use. Reselling or distributing this source code on public platforms is strictly prohibited.
- **Commercial License**: Permitted to modify, brand, and deploy as a commercial portal for clients or active web platforms.
