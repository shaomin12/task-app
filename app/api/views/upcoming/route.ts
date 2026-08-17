import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getUpcomingView } from "@/lib/tasks";

export async function GET() {
  const user = await getCurrentUser();
  const view = await getUpcomingView(user.id);
  return NextResponse.json(view);
}
