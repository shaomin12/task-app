import { getCurrentUser } from "@/lib/current-user";
import { listTasksForUser } from "@/lib/tasks";
import { listProjectsForUser } from "@/lib/projects";
import { TaskForm } from "@/components/task/task-form";
import { TaskBrowser } from "@/components/task/task-browser";

export default async function AllTasksPage() {
  const user = await getCurrentUser();
  const [tasks, projects] = await Promise.all([
    listTasksForUser(user.id),
    listProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">All Tasks</h1>
      <TaskForm
        projects={projects}
        defaultPriority={user.defaultPriority}
        preselectProjectId={user.defaultProjectId ?? undefined}
      />
      <TaskBrowser initialTasks={tasks} projects={projects} />
    </div>
  );
}
