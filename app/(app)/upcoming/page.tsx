import { getCurrentUser } from "@/lib/current-user";
import { getUpcomingView } from "@/lib/tasks";
import { UpcomingView } from "@/components/task/upcoming-view";

export default async function UpcomingPage() {
  const user = await getCurrentUser();
  const view = await getUpcomingView(user.id, user.weekStartsOn === 0 ? 0 : 1);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Upcoming</h1>
      <UpcomingView initialView={view} />
    </div>
  );
}
