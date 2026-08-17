import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();

  const [projects, tasks, tags] = await Promise.all([
    prisma.project.findMany({ where: { userId: user.id } }),
    prisma.task.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { subtasks: true, taskTags: { include: { tag: true } } },
    }),
    prisma.tag.findMany({ where: { userId: user.id } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    projects,
    tags,
    tasks: tasks.map(({ taskTags, ...task }) => ({
      ...task,
      tags: taskTags.map((tt) => tt.tag.name),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ledger-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
