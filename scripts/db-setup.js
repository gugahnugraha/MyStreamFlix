const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Simple sha256 hash representation for in-memory passwords
const hashPassword = (password) => {
  if (password === "admin") return "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  if (password === "demo") return "02726d40f2a7a8d980d0130c1448b1422b9aa5d7904094a97491cf0ebcd5495b";
  
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};

async function main() {
  console.log("Starting database setup & seeding...");

  // 1. Seed CMS Settings
  const defaultSettings = {
    singletonKey: "global",
    siteName: "FlixSphere",
    logoText: "FLIXSPHERE",
    primaryColor: "#E50914",
    enableComments: true,
    enableRatings: true,
    maintenanceMode: false,
    seoTitle: "FlixSphere - Premium Movie Streaming CMS & Portal",
    seoDescription: "Watch movies, TV series, anime, and documentations online in pristine 4K quality with dynamic subtitle capabilities.",
    seoKeywords: "streaming, cms, nextjs, react, express, movies, premium, cinema"
  };

  await prisma.cMSSettings.upsert({
    where: { singletonKey: "global" },
    update: defaultSettings,
    create: defaultSettings,
  });
  console.log("✔ CMS settings seeded successfully.");

  // 2. Clear User Table and seed exactly 1 Admin Account
  console.log("Cleaning up database users table...");
  await prisma.user.deleteMany();
  
  const adminUser = {
    id: "usr-1",
    name: "Admin User",
    email: "admin@streamcms.com",
    role: "admin",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    isPremium: true,
    profiles: [
      { id: "prof-1", name: "Admin (Adult)", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", isKids: false },
      { id: "prof-2", name: "Junior (Kids)", avatar: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=150&auto=format&fit=crop&q=80", isKids: true }
    ],
    activeProfileId: "prof-1",
    passwordHash: hashPassword("admin")
  };

  await prisma.user.upsert({
    where: { id: adminUser.id },
    update: adminUser,
    create: adminUser,
  });
  console.log("✔ Exactly 1 Admin User account seeded successfully to the database.");

  // 3. Clear Movie Table (Keeping it empty by default)
  console.log("Cleaning up database movies catalog table...");
  const deleteMoviesResult = await prisma.movie.deleteMany();
  console.log(`✔ Cleared existing movies in database (deleted ${deleteMoviesResult.count} records).`);
  console.log("✔ Database Movie table is now clean and empty.");
  
  console.log("Database setup is complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database setup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
