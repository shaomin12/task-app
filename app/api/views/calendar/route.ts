import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listTasksInRange } from "@/lib/tasks";
import type { Priority, TaskStatus } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const params = new URL(request.url).searchParams;
  const start = params.get("start");
  const end = params.get("end");
  const priorityParam = params.get("priority");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 422 });
  }

  const tasks = await listTasksInRange(
    user.id,
    new Date(`${start}T00:00:00Z`),
    new Date(`${end}T23:59:59Z`),
    {
      projectId: params.get("projectId") ?? undefined,
      q: params.get("q") ?? undefined,
      status: (params.get("status") as TaskStatus | null) ?? undefined,
      priority: priorityParam ? (priorityParam.split(",") as Priority[]) : undefined,
    }
  );

  return NextResponse.json(tasks);
}
