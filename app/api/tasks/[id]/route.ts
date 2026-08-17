import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updateTaskSchema } from "@/lib/validation/task";
import { ensureTagIds } from "@/lib/tags";
import { taskInclude, shapeTask, generateNextOccurrence } from "@/lib/tasks";

async function loadOwnedTask(userId: string, id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== userId || task.deletedAt) return null;
  return task;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const owned = await loadOwnedTask(user.id, id);
  if (!owned) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: taskInclude,
  });

  return NextResponse.json(shapeTask(task));
}

const TRACKED_FIELDS = ["title", "status", "priority", "dueDate", "projectId"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const existing = await loadOwnedTask(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid task data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { tags, dueDate, status, ...rest } = parsed.data;

  if (rest.projectId) {
    const project = await prisma.project.findUnique({ where: { id: rest.projectId } });
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const data: Record<string, unknown> = { ...rest };

  if (dueDate !== undefined) {
    data.dueDate = dueDate ? new Date(`${dueDate}T00:00:00Z`) : null;
  }

  if (status !== undefined) {
    data.status = status;
    data.completedAt = status === "COMPLETED" ? new Date() : null;
  }

  if (tags !== undefined) {
    const tagIds = await ensureTagIds(user.id, tags);
    await prisma.taskTag.deleteMany({ where: { taskId: id } });
    data.taskTags = { create: tagIds.map((tagId) => ({ tagId })) };
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });

  const changeLogs = TRACKED_FIELDS.filter(
    (field) => field in parsed.data && String(existing[field]) !== String(task[field])
  ).map((field) => ({
    taskId: id,
    userId: user.id,
    field,
    oldValue: existing[field] === null ? null : String(existing[field]),
    newValue: task[field] === null ? null : String(task[field]),
  }));

  if (changeLogs.length > 0) {
    await prisma.activityLog.createMany({ data: changeLogs });
  }

  if (status === "COMPLETED" && task.recurringTaskId) {
    const next = await generateNextOccurrence(task.recurringTaskId, task.dueDate);
    if (next) {
      await prisma.activityLog.create({
        data: {
          taskId: next.id,
          userId: user.id,
          field: "status",
          oldValue: null,
          newValue: "Next occurrence generated",
        },
      });
    }
  }

  return NextResponse.json(shapeTask(task));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const existing = await loadOwnedTask(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
