# MyStreamFlix Setup & Deployment Guide

Welcome to **MyStreamFlix**! Thank you for your purchase. This guide will help you install, configure, and deploy your new streaming platform in just a few minutes.

## 🚀 1. Prerequisites

Before starting, ensure you have the following installed on your computer:
*   **Node.js** (v18.17.0 or higher) - [Download here](https://nodejs.org/)
*   **Git** (optional but recommended) - [Download here](https://git-scm.com/)
*   A code editor like **Visual Studio Code**

---

## 🛠️ 2. Local Installation

1.  **Extract the ZIP file** you downloaded into a folder on your computer.
2.  Open your terminal (or Command Prompt / PowerShell) and navigate to that folder:
    ```bash
    cd path/to/MyStreamFlix
    ```
3.  **Install the dependencies** by running:
    ```bash
    npm install
    ```

---

## ⚙️ 3. Environment Configuration (.env)

The project requires environment variables to function correctly.

1.  In the root folder, duplicate the `.env.example` file and rename it to `.env`.
2.  Open `.env` in your code editor.
3.  **Authentication Secret**:
    Update `JWT_SECRET` and `SESSION_SECRET` with strong, random strings.
    ```env
    JWT_SECRET="your_very_long_secure_random_string_here"
    SESSION_SECRET="another_very_long_secure_random_string_here"
    ```

---

## 🗄️ 4. Database Setup

MyStreamFlix uses Prisma ORM and is configured by default to use an in-memory database if no connection string is provided, which is great for testing!

However, for production, you should connect to a real database (like PostgreSQL, MongoDB, or Supabase).

1.  **To use a real database**:
    Update the `DATABASE_URL` in your `.env` file.
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
    ```
2.  **Initialize the Database**:
    Run the following command to push the schema to your database and seed the default Admin account.
    ```bash
    npm run db:setup
    ```
    *Note: This command will create the default admin account: `admin@streamcms.com` / `admin`.*

---

## 💳 5. Payment Gateway Setup (Optional)

If you plan to charge users for subscriptions, you need to configure Stripe or PayPal.

**Stripe Setup**:
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys).
2. Copy your **Publishable key** and **Secret key**.
3. Add them to your `.env` file:
    ```env
    STRIPE_PUBLIC_KEY="pk_test_your_key_here"
    STRIPE_SECRET_KEY="sk_test_your_key_here"
    ```

**PayPal Setup**:
Add your PayPal Client ID and Secret to the `.env` file if you prefer PayPal.

*Note: If you leave these blank, the app will automatically fall back to a "Sandbox/Simulation" payment mode so you can test the UI without real credentials!*

---

## 🏃 6. Running Locally

Start your development server to see the app in action:

```bash
npm run dev
```

Open your browser and navigate to: `http://localhost:3000`
You can log in with the admin account (`admin@streamcms.com` / `admin`) to access the Admin CMS!

---

## 🌍 7. Deployment to Vercel (Recommended)

Deploying to Vercel is the easiest and most optimized way to host Next.js apps.

1.  Create a free account on [Vercel](https://vercel.com/).
2.  Upload your project to a GitHub repository.
3.  In Vercel, click **"Add New..." > "Project"** and import your GitHub repository.
4.  **Important**: In the Vercel deployment settings, expand "Environment Variables" and add all the variables from your `.env` file (e.g., `JWT_SECRET`, `SESSION_SECRET`, `DATABASE_URL`).
5.  Click **Deploy**.

Vercel will automatically build and host your site.

---

### Need Help?
If you encounter any issues, feel free to review the main `README.md` file for deeper technical documentation or contact support. Enjoy your new streaming platform!
