import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createProjectSchema } from "@/lib/validation/project";
import { listProjectsForUser, listArchivedProjectsForUser } from "@/lib/projects";
import { ensureTagIds } from "@/lib/tags";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const archived = new URL(request.url).searchParams.get("archived") === "true";
  const projects = archived
    ? await listArchivedProjectsForUser(user.id)
    : await listProjectsForUser(user.id);
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { tags, ...rest } = parsed.data;
  const tagIds = tags ? await ensureTagIds(user.id, tags) : [];

  const project = await prisma.project.create({
    data: {
      ...rest,
      userId: user.id,
      projectTags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: { projectTags: { include: { tag: true } } },
  });

  const { projectTags, ...shapedProject } = project;

  return NextResponse.json(
    { ...shapedProject, taskCount: 0, completedTaskCount: 0, tags: projectTags.map((pt) => pt.tag) },
    { status: 201 }
  );
}
