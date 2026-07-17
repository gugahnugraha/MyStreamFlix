# 💰 Gumroad / Marketplace Copy-Paste Product Listing Template

Use this document to quickly fill in your product listing page on Gumroad, Lemon Squeezy, Ko-fi, or itch.io! 

---

## 🏷️ Suggested Product Titles
1.  **MyStreamFlix - Next.js 15 Video Streaming SaaS Portal with Admin CMS & Prisma ORM**
2.  **Premium Full-Stack Cinematic Video Library & CMS Web App Template (Next.js + Prisma)**
3.  **Modern Cinematic Streaming Web Portal — Next.js 15, Prisma, Tailwind CSS v4 Developer Kit**

---

## ⚡ Catchy Tagline / Pitch Intro
> **"Launch your own beautifully designed, serverless-ready cinematic streaming portal in less than 5 minutes."**
> 
> Stop spending months building video libraries and database APIs from scratch. **MyStreamFlix** is a production-ready, highly polished full-stack streaming template built on Next.js 15 featuring a premium cinema dark theme, cookie session auth, interactive player simulators, comprehensive catalog CMS, user role moderators, and real-time analytics.

---

## 🌟 What makes MyStreamFlix different? (The "Sales Hooks")
*   **Zero Complex Database Setup Fallback**: Operates on a smart hybrid database model. Runs instantly locally via an in-memory data store with preloaded movie seed catalogs out of the box—perfect for demonstrating to clients or testing!
*   **Smart Database Fallback & Seeding**: Running `npm run db:setup` initializes tables and registers **exactly 1 Admin Account** (`admin@streamcms.com` / `admin`). If the database has 0 movies, it automatically falls back to showing 100 local dummy movies in-memory, switching to database-only mode once you import content!
*   **Plug-and-Play Stripe & PayPal Subscriptions (USD)**: Fully integrated out of the box! Supports Credit Cards via the official Stripe SDK and PayPal subscriptions. The website owner only has to copy their API keys into the `.env` file to go live.
*   **Zero-Config Payment Sandbox**: If payment credentials are left blank in `.env`, the checkout automatically falls back to an interactive simulated credit card payment flow.
*   **Instant TMDB (The Movie Database) Metadata Integrator**: Admin CMS lets you search titles and instantly auto-fill metadata—synopsis, poster/backdrop image links, release year, genres, directors, cast lists, and TV series season/episode schemas.
*   **Production-Ready with Prisma ORM**: Easily plug in PostgreSQL, Supabase, or MongoDB database backends by simply setting a `DATABASE_URL` env variable.
*   **Cookie Session Multi-Profile Space**: True SaaS capabilities where multiple users can register, manage up to 5 profiles (including a strict age-gated Kids Mode space), write reviews, and track play progress.
*   **Deep Real-Time Analytics**: Visual tracking of key stats (Active 24h Watchers, Watch Hours, Monthly revenue) and dynamic demographic segmentation split progress bars (Adult vs Kids profiles, Free vs VIP Premium subscribers).
*   **Premium Interactive Brand Footer**: Responsive layout containing newsletter subscriptions, social links, dynamic navigation links, and copyright compliance.
*   **Cinematic Playback Fail-Safe**: If any direct video stream fails, the app automatically transitions into an atmospheric mock cinema playback simulation complete with interactive speed controls, working subtitles, and details, ensuring visitors are never greeted by a broken screen.
*   **Fully Equipped Admin Console**: Modify your catalog, manage user accounts (promote viewers to admin or remove accounts), change global settings, and view real-time traffic statistics instantly.

---

## 🎨 What is Included in the Digital ZIP File?
1.  **Full Source Code**: Pristine, clean, and modular TypeScript files (Next.js App Router structure, client components, and serverless API routes).
2.  **Prisma Schema Options**: Default PostgreSQL/Supabase schema + specialized MongoDB schema variant.
3.  **Complete Documentation Suite**: Extensive `README.md` (English) and `README_ID.md` (Indonesian) files containing installation guides, payment credentials configuration tutorials, and database setups.
4.  **Static UI Assets**: Organized vector icons and custom styles.

---

## 💡 Recommended Pricing Strategy
*   **Tier 1: Personal Developer License ($24.99 - $29.99)**
    *   *Best for*: Learning, personal portfolios, or deploying a private media hub.
*   **Tier 2: Commercial Rebranding License ($79.00 - $99.00)**
    *   *Best for*: Freelancers, web agencies, and creators looking to launch customized streaming sites for clients or monetize their own premium channels.

---

## 📝 Sales Page Copy-Paste Text
*(Copy and paste everything below into your Gumroad Product Description)*

---

### **Launch Your Own Premium Cinematic Streaming Platform Today!**

**MyStreamFlix** is a premium, full-stack video-on-demand (VoD) portal and CMS template designed with a stunning, high-contrast cinematic theme. Perfect for developers, creators, online course providers, or agencies, this template provides a fully featured video experience with seamless deployment to Vercel.

### **🎥 What's Under the Hood?**

#### **1. Immersive User Experience**
*   **Fluid Hero Carousel**: Engaging landing page spotlights powered by custom hardware-accelerated animations (`fadeInScale` and `slideUpText`).
*   **Advanced Fullscreen Video Player**: Scopes the fullscreen viewport to the video panel only (hiding the TV series sidebar) for immersive playback. Features play/pause overlay, speed controls, volume scrubbing, and keyboard Escape synchronization.
*   **Multi-Language Subtitles**: Interactive subtitles in English, Indonesian, Spanish, and French.
*   **Robust Video Player**: Plays MP4 and HLS direct streams with a high-fidelity interactive simulation fallback to maintain customer engagement if a video stream goes offline.
*   **Premium Interactive Footer**: Complete with explore links, brand info, and quick social redirection buttons.
*   **Social & Interactive**: Let your users leave comments and score content out of 10. Recommend "More Like This" automatically with smart tag matches.

#### **2. Powerhouse Admin Command Center**
*   **TMDB Integrator**: Populate movie metadata instantly. Search the TMDB database directly from the CMS form and auto-fill titles, summaries, posters, backdrops, and TV series season layouts.
*   **Catalog CMS**: Manage titles, posters, stream backdrops, quality levels, and durations from an intuitive dashboard. Easily build TV series seasons and episodes.
*   **Deep Real-time Analytics**: Real active 24h watchers, total streaming watch hours, and dynamic monthly revenue ($5.99 per premium account) recalculated automatically on each user change. Includes theme-color aligned views graphs and interactive Top Genre SVG Donut charts.
*   **Demographic Split Trackers**: Side-by-side progress bars charting viewer splits (Adult vs Kids Mode) and conversion ratios (Standard vs VIP).
*   **User Base Control**: Directly promote registered members to Administrators or remove active accounts to ensure site moderation.
*   **SEO & Global Control**: Toggle default mock simulations, customize logo text, select primary theme color brand presets, and configure search metadata straight from the UI.

#### **3. Plug-and-Play Stripe & PayPal Subscriptions (USD Only)**
*   **Double Gateway Checkout**: Includes both Stripe Card payments (powered by the official Stripe SDK) and PayPal subscriptions.
*   **Developer Sandbox Fallback**: Auto-detects empty keys in `.env` and safely falls back to a sandbox simulated payment card screen, making it 100% reviewable and error-free out of the box.
*   **Webhooks Handlers**: Secure webhook endpoints for Stripe and PayPal to process payments asynchronously and upgrade accounts automatically.

### **🛠️ Clean & Modern Technology Stack**
*   **Core**: Next.js 15 (App Router), React 19, TypeScript
*   **Database**: Prisma ORM with hybrid support (Zero-Config In-Memory fallback vs Supabase, MongoDB, or PostgreSQL databases)
*   **Styling**: Tailwind CSS v4 and dynamic theme color customization
*   **Authentication**: Multi-profile HTTP-only secure cookie session space (HMAC SHA-256 cryptographically signed)

---

### **📋 Frequently Asked Questions (FAQ)**

**Q: Do I need a database server like PostgreSQL or MongoDB to run this?**
A: Yes, a database is required for production deployments to persist your data, but you can run and test the project completely database-free using the built-in in-memory fallback (loaded with dummy metadata for testing and trials).

**Q: Can I connect my own database if needed later?**
A: Yes! The database backend uses Prisma ORM. Simply configure the `DATABASE_URL` environment variable to connect to Supabase, PostgreSQL, or MongoDB, and run `npm run db:setup` to initialize tables, seed settings, and register exactly 1 Admin Account (`admin@streamcms.com` / `admin`).

**Q: Is it easy to brand or customize the logo?**
A: Absolutely. All styles are declared with Tailwind CSS. Plus, you can change the site name, logo text, primary brand color presets, and SEO settings directly from the Admin CMS panel!

**Q: How do I test the administrator view?**
A: Use the pre-seeded admin account inside the source files (`admin@streamcms.com` / `admin`) to unlock full access immediately. We also provide a pre-seeded viewer demo account (`demo@viewer.com` / `demo`).

---
*Add MyStreamFlix to your cart today, select your license, and start streaming!* 🍿🎬
