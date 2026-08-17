import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reorder data" }, { status: 422 });
  }

  const tasks = await prisma.task.findMany({ where: { id: { in: parsed.data.ids } } });
  if (tasks.length !== parsed.data.ids.length || tasks.some((t) => t.userId !== user.id)) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.$transaction(
    parsed.data.ids.map((id, index) =>
      prisma.task.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
