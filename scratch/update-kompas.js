const path = require('path');
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_k8ioMfrNCTv2@ep-damp-meadow-ao2cchel-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const { PrismaClient } = require(path.resolve(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Update Kompas TV
    const updateRes = await prisma.movie.updateMany({
      where: {
        OR: [
          { id: 'tv-kompastv' },
          { title: { contains: 'Kompas', mode: 'insensitive' } }
        ]
      },
      data: {
        videoUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h234/index.m3u8'
      }
    });
    console.log('Kompas TV updated in DB:', updateRes);

    // 2. Cek semua channel & deteksi duplikasi berdasarkan videoUrl atau title
    const channels = await prisma.movie.findMany({
      where: {
        OR: [
          { contentType: 'livetv' },
          { id: { startsWith: 'tv-' } }
        ]
      },
      select: { id: true, title: true, videoUrl: true, contentType: true },
      orderBy: { title: 'asc' }
    });
    console.log('Total live channels in DB:', channels.length);

    // Deteksi duplikasi judul atau URL
    const seenTitles = new Map();
    const seenUrls = new Map();
    const duplicates = [];

    for (const ch of channels) {
      const cleanTitle = ch.title.trim().toLowerCase();
      const cleanUrl = (ch.videoUrl || '').trim();
      if (seenTitles.has(cleanTitle)) {
        duplicates.push({ reason: 'Title duplicate: ' + ch.title, keep: seenTitles.get(cleanTitle), duplicate: ch });
      } else {
        seenTitles.set(cleanTitle, ch);
      }

      if (cleanUrl && seenUrls.has(cleanUrl)) {
        duplicates.push({ reason: 'URL duplicate: ' + cleanUrl, keep: seenUrls.get(cleanUrl), duplicate: ch });
      } else if (cleanUrl) {
        seenUrls.set(cleanUrl, ch);
      }
    }

    if (duplicates.length > 0) {
      console.log('Duplicates detected:', duplicates);
      for (const d of duplicates) {
        console.log(`Deleting duplicate ID: ${d.duplicate.id} (${d.duplicate.title})`);
        await prisma.movie.delete({ where: { id: d.duplicate.id } });
      }
    } else {
      console.log('No duplicates found in database!');
    }

    const finalChannels = await prisma.movie.findMany({
      where: {
        OR: [
          { contentType: 'livetv' },
          { id: { startsWith: 'tv-' } }
        ]
      },
      select: { id: true, title: true, videoUrl: true },
      orderBy: { title: 'asc' }
    });
    console.table(finalChannels);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
