import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updateSubtaskSchema } from "@/lib/validation/subtask";

async function loadOwnedSubtask(userId: string, taskId: string, subId: string) {
  const subtask = await prisma.subtask.findUnique({
    where: { id: subId },
    include: { task: true },
  });
  if (!subtask || subtask.taskId !== taskId || subtask.task.userId !== userId) {
    return null;
  }
  return subtask;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const user = await getCurrentUser();
  const { id, subId } = await params;

  const existing = await loadOwnedSubtask(user.id, id, subId);
  if (!existing) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subtask data", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const subtask = await prisma.subtask.update({ where: { id: subId }, data: parsed.data });
  return NextResponse.json(subtask);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const user = await getCurrentUser();
  const { id, subId } = await params;

  const existing = await loadOwnedSubtask(user.id, id, subId);
  if (!existing) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  await prisma.subtask.delete({ where: { id: subId } });
  return NextResponse.json({ ok: true });
}
