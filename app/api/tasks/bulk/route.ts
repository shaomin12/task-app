import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { generateNextOccurrence } from "@/lib/tasks";
import { TaskStatus } from "@/app/generated/prisma/enums";

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

const bulkStatusSchema = bulkIdsSchema.extend({
  status: z.enum(TaskStatus),
});

// Bulk status change — used by the multi-select action bar on task list
// views. Only touches tasks the caller actually owns, regardless of what ids
// are submitted, same ownership guarantee as the single-task PATCH route.
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = bulkStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bulk update", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { ids, status } = parsed.data;

  const owned = await prisma.task.findMany({
    where: { id: { in: ids }, userId: user.id, deletedAt: null },
    select: { id: true, recurringTaskId: true, dueDate: true },
  });
  const ownedIds = owned.map((t) => t.id);
  if (ownedIds.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  await prisma.task.updateMany({
    where: { id: { in: ownedIds } },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  if (status === "COMPLETED") {
    for (const task of owned) {
      if (task.recurringTaskId) {
        await generateNextOccurrence(task.recurringTaskId, task.dueDate);
      }
    }
  }

  return NextResponse.json({ updated: ownedIds.length });
}

// Bulk soft-delete.
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = bulkIdsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bulk delete", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const result = await prisma.task.updateMany({
    where: { id: { in: parsed.data.ids }, userId: user.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ deleted: result.count });
}
