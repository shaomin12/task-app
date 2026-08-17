import { getCurrentUser } from "@/lib/current-user";
import { listTasksForUser } from "@/lib/tasks";
import { listProjectsForUser } from "@/lib/projects";
import { KanbanBoard } from "@/components/kanban/board";

export default async function KanbanPage() {
  const user = await getCurrentUser();
  const [tasks, projects] = await Promise.all([
    listTasksForUser(user.id, { sort: "manual" }),
    listProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Kanban</h1>
      <KanbanBoard initialTasks={tasks} projects={projects} />
    </div>
  );
}
