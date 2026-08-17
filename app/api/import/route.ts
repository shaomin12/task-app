import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { ensureTagIds } from "@/lib/tags";
import { TaskStatus, Priority } from "@/app/generated/prisma/enums";

const importSchema = z.object({
  projects: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().nullable().optional(),
        color: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  tasks: z
    .array(
      z.object({
        projectId: z.string().nullable().optional(),
        title: z.string().min(1).max(200),
        description: z.string().nullable().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        progressPercent: z.number().nullable().optional(),
        dueDate: z.string().nullable().optional(),
        dueTime: z.string().nullable().optional(),
        completedAt: z.string().nullable().optional(),
        tags: z.array(z.string()).optional().default([]),
        subtasks: z
          .array(
            z.object({
              title: z.string().min(1),
              done: z.boolean().optional().default(false),
            })
          )
          .optional()
          .default([]),
      })
    )
    .optional()
    .default([]),
});

// Imports are strictly additive: every project/task from the file becomes a
// brand-new row owned by the current user. Nothing existing is ever
// modified or deleted, and nothing here can fail partway and leave the
// import "half applied" in a confusing state, since each row is independent.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "That file doesn't look like a valid export.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { projects, tasks } = parsed.data;

  const projectIdMap = new Map<string, string>();
  for (const project of projects) {
    const created = await prisma.project.create({
      data: {
        userId: user.id,
        name: project.name,
        description: project.description ?? null,
        color: project.color ?? "#2f5d50",
      },
    });
    projectIdMap.set(project.id, created.id);
  }

  let tasksCreated = 0;
  for (const task of tasks) {
    const status = Object.values(TaskStatus).includes(task.status as TaskStatus)
      ? (task.status as TaskStatus)
      : "TODO";
    const priority = Object.values(Priority).includes(task.priority as Priority)
      ? (task.priority as Priority)
      : "MEDIUM";
    const tagIds = task.tags.length ? await ensureTagIds(user.id, task.tags) : [];

    await prisma.task.create({
      data: {
        userId: user.id,
        projectId: task.projectId ? (projectIdMap.get(task.projectId) ?? null) : null,
        title: task.title,
        description: task.description ?? null,
        status,
        priority,
        progressPercent: task.progressPercent ?? null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        dueTime: task.dueTime ?? null,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        taskTags: { create: tagIds.map((tagId) => ({ tagId })) },
        subtasks: {
          create: task.subtasks.map((s, i) => ({ title: s.title, done: s.done, sortOrder: i })),
        },
      },
    });
    tasksCreated++;
  }

  return NextResponse.json({ projectsCreated: projects.length, tasksCreated });
}
