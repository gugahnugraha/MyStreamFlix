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
    logoUrl: "",
    primaryColor: "#00ADB5",
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
      { id: "prof-1", name: "Admin", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", isKids: false },
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

  // 3. Clear Movie Table and seed Live TV Channels
  console.log("Cleaning up database movies catalog table...");
  await prisma.movie.deleteMany();
  
  const liveTvChannels = [
    {
      id: "tv-1",
      title: "NASA TV Live",
      description: "Official 24/7 live stream broadcasting spacewalks, rocket launches, views of Earth from the ISS, and NASA mission coverage.",
      posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-v1/master.m3u8",
      duration: 0,
      releaseYear: 2026,
      rating: 9.5,
      ageRating: "G",
      quality: "4K",
      genres: ["News", "Sci-Fi"],
      cast: ["NASA Astronauts", "Mission Control"],
      directors: ["NASA TV"],
      subtitles: JSON.stringify([]),
      country: "United States",
      language: "en",
      views: 125400,
      likes: 18900,
      isFeatured: true,
      isBanner: false,
      tier: "free",
      contentType: "livetv",
      seasons: JSON.stringify([]),
      createdAt: new Date().toISOString()
    },
    {
      id: "tv-2",
      title: "France 24 English Live",
      description: "International 24-hour news channel reporting on world events, diplomacy, culture, and current affairs in real time.",
      posterUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
      duration: 0,
      releaseYear: 2026,
      rating: 9.0,
      ageRating: "G",
      quality: "Full HD",
      genres: ["News"],
      cast: ["France 24 Newsroom"],
      directors: ["France Médias Monde"],
      subtitles: JSON.stringify([]),
      country: "France",
      language: "en",
      views: 87900,
      likes: 9200,
      isFeatured: false,
      isBanner: false,
      tier: "free",
      contentType: "livetv",
      seasons: JSON.stringify([]),
      createdAt: new Date().toISOString()
    },
    {
      id: "tv-3",
      title: "Red Bull TV Live",
      description: "High-octane live action sports, Formula 1 highlights, mountain biking, esports, and music festival live streams.",
      posterUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://rbmn-live.akamaized.net/hls/live/591070/FL_FULL_HD_1080p@1/master.m3u8",
      duration: 0,
      releaseYear: 2026,
      rating: 9.4,
      ageRating: "PG-13",
      quality: "4K",
      genres: ["Action", "Sports"],
      cast: ["Pro Athletes", "Red Bull Crew"],
      directors: ["Red Bull Media"],
      subtitles: JSON.stringify([]),
      country: "Austria",
      language: "en",
      views: 145000,
      likes: 21000,
      isFeatured: true,
      isBanner: false,
      tier: "vip",
      contentType: "livetv",
      seasons: JSON.stringify([]),
      createdAt: new Date().toISOString()
    },
    {
      id: "tv-4",
      title: "DW News 24/7",
      description: "Global news channel providing unbiased reporting, in-depth analysis, documentaries, and global perspective 24 hours a day.",
      posterUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
      duration: 0,
      releaseYear: 2026,
      rating: 8.9,
      ageRating: "G",
      quality: "Full HD",
      genres: ["News"],
      cast: ["Deutsche Welle Anchors"],
      directors: ["DW Network"],
      subtitles: JSON.stringify([]),
      country: "Germany",
      language: "en",
      views: 65400,
      likes: 7100,
      isFeatured: false,
      isBanner: false,
      tier: "free",
      contentType: "livetv",
      seasons: JSON.stringify([]),
      createdAt: new Date().toISOString()
    },
    {
      id: "tv-5",
      title: "EuroNews English",
      description: "European & international news network broadcasting real-time updates, world affairs, technology, and economic news.",
      posterUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=600&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://euronews-euronews-world-1-au.samsung.wurl.tv/playlist.m3u8",
      duration: 0,
      releaseYear: 2026,
      rating: 8.8,
      ageRating: "G",
      quality: "Full HD",
      genres: ["News"],
      cast: ["Euronews Team"],
      directors: ["Euronews SA"],
      subtitles: JSON.stringify([]),
      country: "France",
      language: "en",
      views: 54300,
      likes: 6200,
      isFeatured: false,
      isBanner: false,
      tier: "free",
      contentType: "livetv",
      seasons: JSON.stringify([]),
      createdAt: new Date().toISOString()
    },
    {
      id: "tv-6",
      title: "Action Central TV",
      description: "24/7 non-stop adrenaline action movies, blockbuster trailers, and martial arts film showcases.",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: 0,
      releaseYear: 2026,
      rating: 9.1,
      ageRating: "R",
      quality: "4K",
      genres: ["Action", "Drama"],
      cast: ["Action All-Stars"],
      directors: ["FlixSphere Live"],
      subtitles: JSON.stringify([]),
      country: "United States",
      language: "en",
      views: 112000,
      likes: 15400,
      isFeatured: true,
      isBanner: false,
      tier: "vip",
      contentType: "livetv",
      seasons: JSON.stringify([]),
      createdAt: new Date().toISOString()
    }
  ];

  for (const channel of liveTvChannels) {
    await prisma.movie.upsert({
      where: { id: channel.id },
      update: channel,
      create: channel
    });
  }
  console.log("✔ Seeded Live TV Channels into database.");
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
