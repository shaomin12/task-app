import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createRecurrenceSchema } from "@/lib/validation/recurrence";
import { taskInclude, shapeTask } from "@/lib/tasks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== user.id || task.deletedAt) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (!task.dueDate) {
    return NextResponse.json(
      { error: "Set a due date before making this task recurring." },
      { status: 422 }
    );
  }
  if (task.recurringTaskId) {
    return NextResponse.json({ error: "This task is already recurring." }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRecurrenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid recurrence data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const recurringTask = await prisma.recurringTask.create({
    data: {
      userId: user.id,
      pattern: parsed.data.pattern,
      daysOfWeek: parsed.data.daysOfWeek ?? [],
      interval: parsed.data.interval ?? 1,
      customUnit: parsed.data.pattern === "CUSTOM" ? parsed.data.customUnit : null,
      endDate: parsed.data.endDate ? new Date(`${parsed.data.endDate}T00:00:00Z`) : null,
      templateTitle: task.title,
      templateDescription: task.description,
      templateProjectId: task.projectId,
      templatePriority: task.priority,
    },
  });

  const updated = await prisma.task.update({
    where: { id },
    data: { recurringTaskId: recurringTask.id },
    include: taskInclude,
  });

  return NextResponse.json(shapeTask(updated), { status: 201 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== user.id) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (!task.recurringTaskId) {
    return NextResponse.json({ error: "This task isn't recurring." }, { status: 422 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { recurringTaskId: null },
    include: taskInclude,
  });

  return NextResponse.json(shapeTask(updated));
}
