import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getCurrentUser();
  const { taskId } = await params;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== user.id) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const logs = await prisma.activityLog.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
