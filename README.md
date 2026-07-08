# 🎬 MyStreamFlix - Premium Cinematic Video-on-Demand (VoD) & CMS SaaS Framework

MyStreamFlix is a high-performance, beautiful, full-stack streaming portal and SaaS template designed with a premium, sleek dark user interface. Built with **Next.js 15 (App Router)** and **Prisma ORM**, it is optimized for developers looking to launch their own streaming platform, video library, course site, or digital media store on Vercel.

It features a gorgeous cinematic player simulator, comment boards, real-time analytics dashboards, and a complete administrative CMS.

---

## ⚡ Key Highlights & Architecture

- **Unified Next.js 15 Stack**: Replaced Express and Vite with a modern, serverless-ready Next.js App Router setup.
- **Hybrid Data Storage Engine (Zero-Config Fallback)**:
  - **In-Memory Mode**: If no database is configured, the application runs instantly out-of-the-box using an in-memory data store preloaded with high-fidelity movie seeds and mock users. Perfect for local previews or zero-setup deployments!
  - **Prisma Database Mode**: When a `DATABASE_URL` is supplied, the app automatically switches to database persistence. Compatible with **Supabase**, **MongoDB**, and **PostgreSQL**.
- **Stateful Multi-User Space**: Built-in authentication using secure, HTTP-only session cookies. Allows multiple users to create distinct profiles, maintain personalized watchlists, watch histories, and review logs.
- **Tailwind CSS v4 & Motion**: Sleek, hardware-accelerated animations (`fadeInScale`, `slideUpText`) for that smooth, premium streaming experience.
- **Storage Agnostic**: Stream video directly via secure URLs from Amazon S3, Cloudflare R2, BunnyCDN, Google Cloud Storage, or simple public drives.

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
│   │   ├── in-memory-db.ts    # Global Mock Data Store
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

### Step 1: Clone and Extract
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
   Rename or create a `.env` file in the root folder and add:
   ```env
   DATABASE_URL="postgresql://postgres.[username]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   TMDB_API_KEY="your_tmdb_key_here" # Optional
   ```
3. **Deploy Schema**:
   Run the Prisma migration tool to create the tables in Supabase:
   ```bash
   npx prisma db push
   ```
4. **Seed Database (Optional)**:
   You are ready to go! Next time you launch `npm run dev`, MyStreamFlix will read and write to Supabase.

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
   - `TMDB_API_KEY` : (Optional, for movie suggestions)
5. Click **Deploy**! Vercel will automatically build the Next.js bundle and set up your serverless endpoints.

> [!WARNING]
> When deploying to Vercel, **you must use a real database**. In-memory mode is transient and will reset on cold starts due to the stateless serverless architecture of Vercel.

---

## 🛡️ Default Administrator Accounts

When running in **In-Memory Mode**, use these credentials to log in:
- **Administrator**: `admin@streamcms.com` / Password: `admin`
- **Demo Viewer**: `demo@viewer.com` / Password: `demo`

*(Note: In database mode, these default accounts will automatically be generated in your database during the first run).*

---

## 📄 License & Distribution Notes

Purchasing this product grants you a **Personal License** or **Commercial License** depending on your selection at checkout:
- **Personal License**: Allowed to run on your own devices for learning, modification, or personal use. Reselling or distributing this source code on public platforms is strictly prohibited.
- **Commercial License**: Permitted to modify, brand, and deploy as a commercial portal for clients or active web platforms.
