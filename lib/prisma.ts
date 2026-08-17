import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL uses Prisma's own "file:" scheme (what the CLI expects for
// db push/migrate); the better-sqlite3 driver adapter wants a plain path.
const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");

const adapter = new PrismaBetterSqlite3({ url: dbPath });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
