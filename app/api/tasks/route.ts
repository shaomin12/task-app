import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createTaskSchema } from "@/lib/validation/task";
import { ensureTagIds } from "@/lib/tags";
import { taskInclude, shapeTask, listTasksForUser, type TaskFilters } from "@/lib/tasks";
import type { Priority, TaskStatus } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const params = new URL(request.url).searchParams;

  const priorityParam = params.get("priority");
  const pageParam = params.get("page");

  const filters: TaskFilters = {
    projectId: params.get("projectId") ?? undefined,
    noProject: params.get("noProject") === "true",
    q: params.get("q") ?? undefined,
    status: (params.get("status") as TaskStatus | null) ?? undefined,
    priority: priorityParam ? (priorityParam.split(",") as Priority[]) : undefined,
    tagId: params.get("tagId") ?? undefined,
    overdueOnly: params.get("overdueOnly") === "true",
    noDueDate: params.get("noDueDate") === "true",
    sort: (params.get("sort") as TaskFilters["sort"]) ?? undefined,
    page: pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined,
  };

  const tasks = await listTasksForUser(user.id, filters);
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid task data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { tags, projectId, dueDate, ...rest } = parsed.data;

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const tagIds = tags ? await ensureTagIds(user.id, tags) : [];

  const task = await prisma.task.create({
    data: {
      ...rest,
      userId: user.id,
      projectId: projectId ?? null,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00Z`) : null,
      taskTags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: taskInclude,
  });

  await prisma.activityLog.create({
    data: {
      taskId: task.id,
      userId: user.id,
      field: "status",
      oldValue: null,
      newValue: "Task created",
    },
  });

  return NextResponse.json(shapeTask(task), { status: 201 });
}
