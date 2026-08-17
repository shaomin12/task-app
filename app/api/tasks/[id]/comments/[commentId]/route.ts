import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

async function loadOwnedComment(userId: string, taskId: string, commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: true },
  });
  if (!comment || comment.taskId !== taskId || comment.task.userId !== userId) {
    return null;
  }
  return comment;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getCurrentUser();
  const { id, commentId } = await params;

  const existing = await loadOwnedComment(user.id, id, commentId);
  if (!existing) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
