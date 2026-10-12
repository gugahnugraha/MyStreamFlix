import { PrismaClient } from "@prisma/client";

const dbUrl = "postgresql://neondb_owner:npg_k8ioMfrNCTv2@ep-damp-meadow-ao2cchel-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function main() {
  try {
    console.log("=== MENGHUBUNGKAN KE NEON POSTGRESQL ===");
    console.log("Host: ep-damp-meadow-ao2cchel-pooler.c-2.ap-southeast-1.aws.neon.tech");
    console.log("Database: neondb\n");

    // 1. Query information_schema untuk melihat semua tabel yang ada di public schema
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("=== DAFTAR TABEL DI DATABASE NEON ===");
    console.log(tables);

    if (tables.length === 0) {
      console.log("\nPERINGATAN: Belum ada tabel sama sekali di database neondb ini (database masih kosong / belum di-push).");
      return;
    }

    // 2. Hitung jumlah baris setiap tabel
    console.log("\n=== JUMLAH BARIS TIAP TABEL ===");
    for (const t of tables) {
      const name = t.table_name;
      try {
        const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${name}";`);
        console.log(`- Tabel "${name}": ${countRes[0].count} data`);
      } catch (err) {
        console.log(`- Tabel "${name}": error (${err.message})`);
      }
    }

    // 3. Inspeksi sampel data film / saluran TV
    try {
      const movieCount = await prisma.movie.count();
      console.log(`\n=== DATA FILM & CHANNEL (Total: ${movieCount}) ===`);
      if (movieCount > 0) {
        const sampleMovies = await prisma.movie.findMany({
          take: 10,
          select: {
            id: true,
            title: true,
            contentType: true,
            releaseYear: true,
            videoUrl: true
          }
        });
        console.log("Sampel 10 Record Teratas:");
        console.table(sampleMovies);

        const liveTvChannels = await prisma.movie.findMany({
          where: { contentType: "livetv" },
          select: { id: true, title: true, videoUrl: true }
        });
        console.log(`\nTotal Live TV Channel: ${liveTvChannels.length}`);
        if (liveTvChannels.length > 0) {
          console.table(liveTvChannels);
        }
      }
    } catch (e) {
      console.log("Model Movie tidak ditemukan atau gagal diakses:", e.message);
    }

    // 4. Inspeksi User
    try {
      const userCount = await prisma.user.count();
      console.log(`\n=== DATA PENGGUNA (Total: ${userCount}) ===`);
      if (userCount > 0) {
        const users = await prisma.user.findMany({
          take: 5,
          select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        console.table(users);
      }
    } catch (e) {
      console.log("Model User tidak ditemukan:", e.message);
    }

    // 5. Inspeksi CMSSettings
    try {
      const settings = await prisma.cMSSettings.findFirst();
      console.log("\n=== PENGATURAN CMS ===");
      console.log(settings);
    } catch (e) {
      console.log("Model CMSSettings tidak ditemukan:", e.message);
    }

  } catch (error) {
    console.error("Gagal terhubung ke database Neon:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
