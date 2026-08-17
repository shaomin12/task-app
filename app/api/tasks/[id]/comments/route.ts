import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createCommentSchema } from "@/lib/validation/comment";

async function assertOwnsTask(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  return task && task.userId === userId && !task.deletedAt ? task : null;
}

function shapeComment(comment: { id: string; taskId: string; body: string; createdAt: Date; updatedAt: Date; user: { name: string | null; email: string | null } }) {
  const { user, ...rest } = comment;
  return { ...rest, authorName: user.name ?? user.email ?? "Unknown" };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const task = await assertOwnsTask(user.id, id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(comments.map(shapeComment));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const task = await assertOwnsTask(user.id, id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comment", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const comment = await prisma.comment.create({
    data: { taskId: id, userId: user.id, body: parsed.data.body },
    include: { user: { select: { name: true, email: true } } },
  });

  await prisma.activityLog.create({
    data: {
      taskId: id,
      userId: user.id,
      field: "comment",
      oldValue: null,
      newValue: "Comment added",
    },
  });

  return NextResponse.json(shapeComment(comment), { status: 201 });
}
