import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "shaomin@addvita.net";
  const password = process.env.SEED_USER_PASSWORD ?? "Ledger-2026-Local!";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: "Shao Min", passwordHash },
  });

  console.log(`Seeded user: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
