import { prisma } from "@/lib/prisma";
import type { ProjectDTO } from "@/lib/types";

const projectInclude = {
  tasks: { where: { deletedAt: null }, select: { status: true } },
  projectTags: { include: { tag: true } },
} as const;

function shapeProject({
  tasks,
  projectTags,
  ...project
}: {
  tasks: { status: string }[];
  projectTags: { tag: { id: string; name: string; color: string } }[];
  [key: string]: unknown;
}) {
  return {
    ...project,
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((t) => t.status === "COMPLETED").length,
    tags: projectTags.map(({ tag }) => tag),
  };
}

export async function listProjectsForUser(userId: string): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: projectInclude,
  });

  // Round-trip through JSON so Date fields become ISO strings, matching
  // what the API route sends over the wire via NextResponse.json().
  return JSON.parse(JSON.stringify(projects.map(shapeProject)));
}

export async function listArchivedProjectsForUser(userId: string): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({
    where: { userId, archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    include: projectInclude,
  });

  return JSON.parse(JSON.stringify(projects.map(shapeProject)));
}

