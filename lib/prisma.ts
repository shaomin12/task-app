import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Local dev / self-hosted (Fly, a VPS, etc.): a plain SQLite file via
// better-sqlite3. Deployed on Vercel (or anywhere with no persistent disk):
// the same schema hosted on Turso (libSQL), selected via TURSO_DATABASE_URL.
const adapter = process.env.TURSO_DATABASE_URL
  ? new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : new PrismaBetterSqlite3({
      // DATABASE_URL uses Prisma's own "file:" scheme (what the CLI expects
      // for db push); better-sqlite3 wants a plain path.
      url: (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
    });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
