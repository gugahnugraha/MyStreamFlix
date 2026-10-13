import { PrismaClient } from "@prisma/client";

const dbUrl = "postgresql://neondb_owner:npg_k8ioMfrNCTv2@ep-damp-meadow-ao2cchel-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function run() {
  try {
    console.log("Checking and migrating Neon PostgreSQL database...");

    // 1. Add translations column to Movie table if not exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "translations" JSONB DEFAULT '{}'::jsonb;
    `);
    console.log("✅ Column 'translations' added to 'Movie' table successfully!");

    // 2. Create Person table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Person" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "biography" TEXT NOT NULL DEFAULT '',
        "translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "birthday" TEXT,
        "deathday" TEXT,
        "placeOfBirth" TEXT,
        "profilePath" TEXT,
        "knownForDepartment" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'Person' verified/created successfully!");

    // 3. Test findMany on Movie
    const movies = await prisma.movie.findMany({ take: 5 });
    console.log("✅ Success! Movie count from real database:", movies.length);
    console.log("Sample movie titles from DB:", movies.map(m => m.title));

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
