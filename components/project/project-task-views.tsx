"use client";

import { useState } from "react";
import { TaskForm } from "@/components/task/task-form";
import { TaskBrowser } from "@/components/task/task-browser";
import { KanbanBoard } from "@/components/kanban/board";
import type { ProjectDTO, TaskDTO } from "@/lib/types";

export function ProjectTaskViews({
  projectId,
  tasks,
  kanbanTasks,
  projects,
  defaultPriority,
}: {
  projectId: string;
  tasks: TaskDTO[];
  kanbanTasks: TaskDTO[];
  projects: ProjectDTO[];
  defaultPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) {
  const [view, setView] = useState<"list" | "kanban">("list");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit gap-1 rounded-md border border-rule p-1">
        {(["list", "kanban"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded px-4 py-1.5 text-sm capitalize ${view === v ? "bg-accent text-surface" : "text-muted hover:text-ink"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <>
          <TaskForm projects={projects} defaultProjectId={projectId} defaultPriority={defaultPriority} />
          <TaskBrowser initialTasks={tasks} projects={projects} lockedProjectId={projectId} />
        </>
      ) : (
        <KanbanBoard initialTasks={kanbanTasks} projects={projects} lockedProjectId={projectId} />
      )}
    </div>
  );
}
