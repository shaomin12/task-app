import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { getCurrentUser } from "@/lib/current-user";
import { listTasksInRange } from "@/lib/tasks";
import { listProjectsForUser } from "@/lib/projects";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  const weekStartsOn = user.weekStartsOn === 0 ? 0 : 1;
  const now = new Date();
  const start = startOfWeek(startOfMonth(now), { weekStartsOn });
  const end = endOfWeek(endOfMonth(now), { weekStartsOn });
  const [tasks, projects] = await Promise.all([
    listTasksInRange(user.id, start, end),
    listProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Calendar</h1>
      <CalendarView initialTasks={tasks} projects={projects} />
    </div>
  );
}
