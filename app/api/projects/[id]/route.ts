import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updateProjectSchema } from "@/lib/validation/project";
import { ensureTagIds } from "@/lib/tags";

async function loadOwnedProject(userId: string, id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== userId) return null;
  return project;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const project = await loadOwnedProject(user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const existing = await loadOwnedProject(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { archived, tags, ...rest } = parsed.data;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...rest,
      ...(archived !== undefined && { archivedAt: archived ? new Date() : null }),
      ...(tags !== undefined && {
        projectTags: {
          deleteMany: {},
          create: (await ensureTagIds(user.id, tags)).map((tagId) => ({ tagId })),
        },
      }),
    },
    include: { projectTags: { include: { tag: true } } },
  });

  const { projectTags, ...shapedProject } = project;

  return NextResponse.json({ ...shapedProject, tags: projectTags.map((pt) => pt.tag) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const existing = await loadOwnedProject(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Tasks aren't deleted with the project — the FK is onDelete: SetNull, so
  // they survive as unassigned ("No project") tasks.
  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
