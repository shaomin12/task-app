import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createSubtaskSchema } from "@/lib/validation/subtask";

async function assertOwnsTask(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  return task && task.userId === userId && !task.deletedAt ? task : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const task = await assertOwnsTask(user.id, id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subtask data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const count = await prisma.subtask.count({ where: { taskId: id } });

  const subtask = await prisma.subtask.create({
    data: { ...parsed.data, taskId: id, sortOrder: count },
  });

  return NextResponse.json(subtask, { status: 201 });
}
