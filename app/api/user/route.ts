import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updateUserSchema } from "@/lib/validation/user";

function omitPasswordHash<T extends { passwordHash: string | null }>(user: T) {
  const safe: Partial<T> = { ...user };
  delete safe.passwordHash;
  return safe;
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(omitPasswordHash(user));
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  return NextResponse.json(omitPasswordHash(updated));
}
