import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// Deletes every task (and its subtasks/tags/comments/activity via cascade),
// every recurring-task rule, every project, and every tag belonging to the
// user — but leaves the User row itself (and its Settings) untouched. This
// is the "start fresh" action; it does not delete the account.
export async function POST() {
  const user = await getCurrentUser();

  await prisma.$transaction([
    prisma.task.deleteMany({ where: { userId: user.id } }),
    prisma.recurringTask.deleteMany({ where: { userId: user.id } }),
    prisma.project.deleteMany({ where: { userId: user.id } }),
    prisma.tag.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
