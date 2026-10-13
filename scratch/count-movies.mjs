import { PrismaClient } from "@prisma/client";

const dbUrl = "postgresql://neondb_owner:npg_k8ioMfrNCTv2@ep-damp-meadow-ao2cchel-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function run() {
  const count = await prisma.movie.count();
  console.log("Total titles in database:", count);
  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, contentType: true, releaseYear: true },
    orderBy: { createdAt: "desc" }
  });
  console.log("Titles found:", movies);
  await prisma.$disconnect();
}

run();
