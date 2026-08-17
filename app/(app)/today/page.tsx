import { getCurrentUser } from "@/lib/current-user";
import { getTodayView } from "@/lib/tasks";
import { TodayView } from "@/components/task/today-view";

export default async function TodayPage() {
  const user = await getCurrentUser();
  const view = await getTodayView(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Today</h1>
      <TodayView initialView={view} />
    </div>
  );
}
