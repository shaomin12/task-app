import { getCurrentUser } from "@/lib/current-user";
import { listTasksForUser } from "@/lib/tasks";
import { listProjectsForUser } from "@/lib/projects";
import { TaskForm } from "@/components/task/task-form";
import { TaskBrowser } from "@/components/task/task-browser";

export default async function InboxPage() {
  const user = await getCurrentUser();
  const [tasks, projects] = await Promise.all([
    listTasksForUser(user.id, { noProject: true }),
    listProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Inbox</h1>
        <p className="text-sm text-muted">
          Tasks that haven&apos;t been assigned to a project yet.
        </p>
      </div>
      <TaskForm projects={projects} defaultPriority={user.defaultPriority} />
      <TaskBrowser
        initialTasks={tasks}
        projects={projects}
        noProject
        emptyMessage="Inbox zero — nothing unassigned."
      />
    </div>
  );
}
