# 🎬 CineManiac - Full-Stack Premium Cinematic Streaming & CMS Web App

CineManiac is a high-performance, beautiful, full-stack streaming portal designed with a premium, sleek dark user interface. Built for developers looking to launch their own streaming site, video library, or portfolio, it combines a gorgeous cinematic player simulator, active review/ratings, real-time analytics, and a comprehensive Admin CMS dashboard (including active user base management).

---

## ✨ Features Highlight

### 🎥 Front-End Cinematic Experience
*   **Hero Spotlights & Carousels**: Fluid automatic slide-switching, complete with custom hardware-accelerated CSS animations (`fadeInScale` and `slideUpText`).
*   **Dual Content-Type support (Movies & TV Series)**: Seamlessly toggle between Movies and TV Series modes, showcasing season-specific dropdown lists and sequential episodic selection resembling major platforms like Prime Video.
*   **Intuitive Search & Filtering**: Instant title searching and interactive genre-based catalog exploration.
*   **High-Fidelity Media Player**:
    *   Direct HLS/MP4 stream support.
    *   **Interactive Cinema Simulator fallback**: If a video stream becomes invalid, the player automatically falls back to an atmospheric high-fidelity mock playback simulator complete with customizable subtitles, speed modifiers, overlay details, and visual error tolerances to prevent dead screens.
*   **Smart Recommendations**: Real-time "More Like This" recommendations generated based on shared genre tags.
*   **Review & Rating Core**: User rating system out of 10 with direct comment boards.
*   **Premium Multi-Language Localization**: A fully integrated dynamic localization engine supporting **English (EN)**, **Indonesian (ID)**, and **Spanish (ES)**, with automatic user preference persistence via `localStorage`.

### 🔐 Multi-Role User Authentication & Security
*   **Multi-Profile Space & Kids Mode**: Create multiple user profiles including a dedicated **Kids Mode** profile tailored with children-friendly visual flags and strict maturity safety filters, reminiscent of Disney+ Hotstar and Prime Video.
*   **Secure Authentication Suite**: Clean login, sign-up, and account profile controls.
*   **Admin CMS & Command Center**:
    *   **User Base Control**: System administrators can promote/demote administrative accounts or permanently delete user accounts with a single click.
    *   **Catalog Customization**: Add, edit, or delete movies from the catalog directly with image references, subtitle tracks, ratings, and categories.
    *   **Real-time Analytics**: Displays live metrics (Active Users, Total Content Views, Streaming Hours) with visual dynamic graph grids.
    *   **SEO & Global Controls**: Customize metadata tags, toggles for streaming simulator defaults, and primary search descriptions directly from the UI.

---

## 🛠️ Technical Architecture

*   **Frontend**: React 18, Vite (superfast compilation and asset processing), Tailwind CSS, Lucide React (vector-perfect icons).
*   **Backend**: Node.js, Express (efficient RESTful API routing, modular sessions).
*   **Animations**: Built-in CSS hardware-accelerated animations for native, buttery-smooth cinematic transitions.

### 📦 Movie & Video File Storage Support
CineManiac is designed to be **storage-agnostic**. Instead of forcing you to use a specific, expensive storage system, the integrated Media Player supports **direct URL streaming**:
*   **Supported File Types**: Pre-encoded `.mp4`, `.webm`, or HLS `.m3u8` streams.
*   **How it Works**: You can host your movie files anywhere—such as **Amazon S3, Cloudflare R2, Google Cloud Storage, Backblaze B2, BunnyCDN**, or even direct-link cloud drivers—and simply paste the video stream URL into the Admin CMS "Video Stream URL" field.
*   **Adaptive Fallback Simulation**: If a movie URL is empty, broken, or blocked, the player automatically triggers a realistic high-fidelity cinematic simulator with customizable running subtitles so your front-end presentation never looks broken to visitors.

### 🗄️ Metadata, Reviews, & User Base Database
By default, the template runs on a highly-optimized, **zero-config in-memory state persistent engine**:
*   **Current Setup**: All metadata (movie titles, categories, ratings, subtitles), comments/reviews, real-time analytics tracker logs, and active registered accounts are stored inside server-side RAM state objects defined in `server.ts`. 
*   **Why this is perfect for Selling on Gumroad**: It requires **absolutely zero database software installations** (such as Docker, Postgres, or MongoDB setups) for your buyers to run the app. It works immediately out of the box with `npm install` and can be easily hosted on any free or low-cost virtual private server (VPS).
*   **How to Connect a Permanent Database**: If you are deploying CineManiac as a production platform and wish to persist metadata permanently, the Express API routing is completely clean and decoupled. You can easily replace the in-memory arrays in `server.ts` with your favorite database driver/ORM:
    *   *Prisma / Drizzle ORM* with PostgreSQL/MySQL.
    *   *Mongoose* with MongoDB.
    *   *Firebase Firestore* for quick, serverless setup.

---

## � Database Integration Guide

This project is intentionally built with in-memory state in `server.ts` so buyers can run it immediately without database setup. For production deployments, you can replace the in-memory arrays with a real database layer while keeping the same Express API routes.

### Recommended integration path
1. Pick a database and ORM/driver:
   * `Prisma` for PostgreSQL, MySQL, or SQLite.
   * `Drizzle ORM` for PostgreSQL, MySQL, or SQLite.
   * `Mongoose` for MongoDB.
   * `Firebase` / `Supabase` for serverless backend storage.
2. Create a new database client file such as `src/db.ts` and use `dotenv` for configuration.
3. Add a `.env` file with your connection string, for example:
   * PostgreSQL / Prisma / Drizzle:
     ```bash
     DATABASE_URL="postgresql://user:password@localhost:5432/cinemaniac"
     ```
   * MySQL / Prisma / Drizzle:
     ```bash
     DATABASE_URL="mysql://user:password@localhost:3306/cinemaniac"
     ```
   * SQLite / Prisma / Drizzle:
     ```bash
     DATABASE_URL="file:./dev.db"
     ```
   * MongoDB / Mongoose (example connection URI):
     ```bash
     MONGODB_URI="mongodb+srv://user:password@cluster0.mongodb.net/cinemaniac?retryWrites=true&w=majority"
     ```
   * Firebase / Supabase (serverless URL + key):
     ```bash
     FIREBASE_DATABASE_URL="https://your-project-id.firebaseio.com"
     FIREBASE_API_KEY="your_api_key"
     ```
     or for Supabase:
     ```bash
     SUPABASE_URL="https://xyzcompany.supabase.co"
     SUPABASE_ANON_KEY="your-anon-key"
     ```
4. Replace the in-memory collections in `server.ts` with database queries, such as:
   * `db.movie.findMany(...)` instead of the `movies` array
   * `db.user.findUnique(...)` instead of `users.find(...)`
   * query tables for favorites, watch history, reviews, and settings
5. Keep the existing route contract so the frontend API calls continue to work:
   * `GET /api/movies`
   * `POST /api/user/favorites`
   * `GET /api/settings`
   * `POST /api/auth/login`, etc.
6. Optionally keep the in-memory seed data for local development by falling back when the database is not configured.

### Quick example with Prisma
* Install:
  ```bash
  npm install @prisma/client
  npm install -D prisma
  ```
* Initialize:
  ```bash
  npx prisma init
  ```
* Define the schema for `Movie`, `User`, `Review`, `WatchHistory`, and `CMSSettings`.
* Run migration:
  ```bash
  npx prisma migrate dev --name init
  ```

### Keep API compatibility
The UI uses the existing backend REST endpoints directly, so you can swap storage implementations without changing frontend code. Only `server.ts` and a new database adapter file are required.

---

## �📂 Folder Structure

```text
├── server.ts              # Express API endpoints & session logic
├── index.html             # Main HTML document entry point
├── package.json           # Dynamic script commands & library dependencies
├── tsconfig.json          # Strict TypeScript compiler options
├── vite.config.ts         # Vite bundler configurations
└── src/
    ├── main.tsx           # React mounting entry point
    ├── App.tsx            # Orchestrator & View manager
    ├── index.css          # Global styles, tailwind integrations, custom animations
    ├── types.ts           # Unified static interfaces & types
    ├── translations.ts    # Unified multi-language translation dictionary and helper
    └── components/
        ├── Header.tsx     # Modern navigation bar & Profile status
        ├── MovieCard.tsx  # Dynamic grid card with hover detail layers
        ├── MovieCarousel.tsx # Fluid automatic spotlight slider
        ├── MovieDetailModal.tsx # Detailed summary, ratings, and similar recommendations
        ├── MediaPlayer.tsx # High-fidelity cinematic stream player
        ├── AuthModal.tsx  # Register & Login dialog
        └── AdminCMS.tsx   # Admin dashboard, User & Catalog Management, Analytics
```

---

## 🚀 Easy Installation Guide

### Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version 18.x or above is highly recommended)
*   [npm](https://www.npmjs.com/) (usually packaged with Node.js)

### Step 1: Clone or Extract the Project
Unzip the project file or pull it into your local directory.
```bash
cd cinemaniac-app
```

### Step 2: Install Dependencies
Install all the required runtime and development dependencies:
```bash
npm install
```

### Step 3: Run the Development Server
Launch the development server. This runs both the Vite asset pipeline and the Express backend simultaneously using `tsx`:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`** to see your app running!

### Step 4: Build for Production
To bundle and compile the application for production optimization:
```bash
npm run build
```
This performs a two-stage compilation:
1.  Compiles the front-end React SPA into high-performance static files in `dist/`.
2.  Bundles the Node/Express server file into a self-contained, optimized file `dist/server.cjs` using `esbuild`.

To start the compiled production server:
```bash
npm run start
```

---

## 🛡️ Default Administrator Account
For early login, testing, and administration out-of-the-box, use these credentials:
*   **Email**: `admin@cine.com`
*   **Password**: `admin123`

*(Note: Additional users registered through the sign-up panel default to "Standard Viewer" and can be promoted by an existing Admin through the CMS "User Base" tab).*

---

## 📄 License & Distribution Notes

Purchasing this product grants you a **Single-Use Personal License** or **Commercial Unlimited License** depending on your selection at checkout:
*   **Personal License**: Allowed to run on your own devices for learning, modification, or personal server setup. Reselling or distributing this source code on public platforms is strictly prohibited.
*   **Commercial License**: Permitted to modify, brand, and deploy as a commercial portal for clients or active web platforms.

For customer support or custom software extension requests, please reach out via the marketplace support desk. Happy building! 🎬🍿
