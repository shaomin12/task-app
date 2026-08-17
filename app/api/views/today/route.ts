import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getTodayView } from "@/lib/tasks";

export async function GET() {
  const user = await getCurrentUser();
  const view = await getTodayView(user.id);
  return NextResponse.json(view);
}
