# Changelog

All notable changes to MyStreamFlix will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-17

### 🎉 Initial Release

#### Core Platform
- Next.js 15 App Router with React 19 and TypeScript
- Tailwind CSS v4 with hardware-accelerated animations
- Prisma ORM with hybrid data storage engine (In-Memory + Database)
- Smart fallback system: zero-config in-memory mode with automatic database switching

#### Authentication & Users
- Cryptographically signed cookie sessions (HMAC SHA-256)
- Multi-profile system (up to 5 profiles per account, including Kids mode)
- Role-based access control (Admin / User)
- User registration, login, and account management

#### Video Player
- Advanced fullscreen video player with custom HUD controls
- Playback speed controller, volume controls, progress scrubbing
- Multi-language subtitle support (EN, ID, ES, FR)
- Cinema simulation fallback for offline/broken streams

#### Admin CMS
- Complete movie & TV series catalog CRUD
- TMDB metadata auto-import (posters, backdrops, cast, genres, seasons)
- Advanced sorting and filtering (by title, year, popularity, content type)
- Real-time analytics dashboard with graphs and demographic splits
- User management (promote to admin, remove accounts)
- SEO and site settings configuration panel

#### Subscription & Payments
- Stripe checkout integration (Credit/Debit cards)
- PayPal subscription integration
- Three-tier plans: VIP ($2.99/mo), Premium ($5.99/mo), Ultra ($8.99/mo)
- Sandbox simulation fallback when API keys are not configured

#### Content Features
- Favorites/Watchlist per user profile
- Watch history with resume playback progress tracking
- User reviews and ratings system
- Smart search with TMDB suggestions
- TV Series builder with dynamic seasons and episodes

#### Database Support
- PostgreSQL (Neon.tech, Supabase, Amazon RDS, etc.)
- MongoDB Atlas (with dedicated schema variant)
- In-memory fallback with 100 pre-loaded dummy movies

#### Internationalization
- English (EN), Indonesian (ID), and Spanish (ES) translations
- Bilingual documentation (README in EN and ID)

#### Deployment
- Vercel-optimized with serverless API routes
- One-command database setup (`npm run db:setup`)
- Production build verified and tested
