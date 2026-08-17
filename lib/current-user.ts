import { prisma } from "@/lib/prisma";

// Login is disabled for now (single local user, no auth screen). Every
// page/API route resolves "the current user" through here instead of a
// session. The Auth.js tables/config in lib/auth.ts are untouched, so
// real login can be switched back on later without a schema change.
export async function getCurrentUser() {
  const email = process.env.SEED_USER_EMAIL ?? "shaomin@addvita.net";
  return prisma.user.findUniqueOrThrow({ where: { email } });
}
