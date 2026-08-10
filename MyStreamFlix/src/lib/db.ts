import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const getPrismaClient = (): PrismaClient | null => {
  if (typeof window !== "undefined") return null; // Prevent client-side instantiations
  
  const hasDbUrl = process.env.DATABASE_URL && 
                   process.env.DATABASE_URL !== "" && 
                   !process.env.DATABASE_URL.includes("MY_DATABASE_URL") &&
                   !process.env.DATABASE_URL.includes("placeholder");
                   
  if (!hasDbUrl) {
    return null;
  }
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
};
