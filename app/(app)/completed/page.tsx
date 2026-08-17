import { getCurrentUser } from "@/lib/current-user";
import { listTasksForUser } from "@/lib/tasks";
import { listProjectsForUser } from "@/lib/projects";
import { TaskBrowser } from "@/components/task/task-browser";

export default async function CompletedPage() {
  const user = await getCurrentUser();
  const [tasks, projects] = await Promise.all([
    listTasksForUser(user.id, { status: "COMPLETED", sort: "updated" }),
    listProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Completed</h1>
        <p className="text-sm text-muted">Tasks marked Complete.</p>
      </div>
      <TaskBrowser
        initialTasks={tasks}
        projects={projects}
        lockedStatus="COMPLETED"
        defaultSort="updated"
        emptyMessage="Nothing completed yet."
      />
    </div>
  );
}
