import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createTagSchema } from "@/lib/validation/tag";

export async function GET() {
  const user = await getCurrentUser();

  const tags = await prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tag data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: parsed.data.name } },
    update: {},
    create: { ...parsed.data, userId: user.id },
  });

  return NextResponse.json(tag, { status: 201 });
}
