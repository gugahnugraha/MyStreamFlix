const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

  // 2. Clear User Table (Keeping it empty by default)
  console.log("Cleaning up database users table...");
  const deleteUsersResult = await prisma.user.deleteMany();
  console.log(`✔ Cleared existing users in database (deleted ${deleteUsersResult.count} records).`);
  console.log("✔ Database User table is now clean and empty.");

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
