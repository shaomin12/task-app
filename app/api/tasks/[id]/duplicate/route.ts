import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { taskInclude, shapeTask } from "@/lib/tasks";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const original = await prisma.task.findUnique({
    where: { id },
    include: { taskTags: true, subtasks: true },
  });

  if (!original || original.userId !== user.id || original.deletedAt) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const copy = await prisma.task.create({
    data: {
      userId: user.id,
      projectId: original.projectId,
      title: `${original.title} (copy)`,
      description: original.description,
      priority: original.priority,
      dueDate: original.dueDate,
      dueTime: original.dueTime,
      status: "TODO",
      taskTags: { create: original.taskTags.map((tt) => ({ tagId: tt.tagId })) },
      subtasks: {
        create: original.subtasks.map((s) => ({
          title: s.title,
          done: false,
          sortOrder: s.sortOrder,
        })),
      },
    },
    include: taskInclude,
  });

  return NextResponse.json(shapeTask(copy), { status: 201 });
}
