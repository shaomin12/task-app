"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TaskDetailDrawer } from "@/components/task/task-detail-drawer";
import { STATUS_LABELS, OVERDUE_ELIGIBLE_STATUSES } from "@/lib/status";
import { localDateString } from "@/lib/date";
import { formatTaskDate } from "@/lib/date-format";
import { useUserPrefs } from "@/lib/user-prefs-context";
import type { TaskDTO, TaskStatus } from "@/lib/types";

const priorityBorder: Record<TaskDTO["priority"], string> = {
  LOW: "border-l-low",
  MEDIUM: "border-l-medium",
  HIGH: "border-l-high",
  URGENT: "border-l-high",
};

function isOverdue(task: TaskDTO) {
  if (!task.dueDate || !OVERDUE_ELIGIBLE_STATUSES.includes(task.status)) return false;
  return task.dueDate.slice(0, 10) < localDateString();
}

// All task-related query keys that a mutation here might affect. Every view
// (All Tasks, a project, Today, Upcoming) reads through one of these, so
// invalidating the whole family keeps every open view in sync.
const TASK_QUERY_FAMILIES = ["tasks", "today", "upcoming", "projects"];

export function TaskRows({
  tasks,
  emptyMessage = "No tasks here.",
  selectedIds,
  onToggleSelect,
}: {
  tasks: TaskDTO[];
  emptyMessage?: string;
  // Bulk-select mode: pass both to render a selection checkbox per row.
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const { dateFormat } = useUserPrefs();

  const invalidate = () =>
    queryClient.invalidateQueries({
      predicate: (q) => TASK_QUERY_FAMILIES.includes(q.queryKey[0] as string),
    });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Unable to update task. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete task. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-rule bg-surface p-6 text-center text-sm italic text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-rule bg-surface">
        {tasks.map((task) => {
          const doneSubtasks = task.subtasks.filter((s) => s.done).length;

          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 border-b border-rule border-l-4 p-4 last:border-b-0 ${priorityBorder[task.priority]} ${task.status === "COMPLETED" ? "opacity-50" : ""}`}
            >
              {selectedIds && onToggleSelect && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  aria-label={`Select "${task.title}"`}
                  className="mt-1 h-4 w-4 accent-accent"
                />
              )}
              <input
                type="checkbox"
                checked={task.status === "COMPLETED"}
                onChange={() =>
                  setStatus.mutate({
                    id: task.id,
                    status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
                  })
                }
                aria-label={`Mark "${task.title}" done`}
                className="mt-1 h-4 w-4 accent-accent"
              />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setOpenTaskId(task.id)}
                  className={`text-left text-sm text-ink hover:underline ${task.status === "COMPLETED" ? "line-through" : ""}`}
                >
                  {task.title}
                </button>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      setStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })
                    }
                    aria-label={`Status for "${task.title}"`}
                    className="rounded-full border border-rule bg-transparent px-2 py-0.5 text-xs text-muted"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {task.status === "IN_PROGRESS" && task.progressPercent != null && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5">
                      {task.progressPercent}%
                    </span>
                  )}
                  {task.project && (
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${task.project.color}22`, color: task.project.color }}
                    >
                      {task.project.name}
                      {task.project.archivedAt && " · Archived"}
                    </span>
                  )}
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                  {task.subtasks.length > 0 && (
                    <span>
                      {doneSubtasks}/{task.subtasks.length} subtasks
                    </span>
                  )}
                  {task.commentCount > 0 && (
                    <span>
                      {task.commentCount} {task.commentCount === 1 ? "comment" : "comments"}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={isOverdue(task) ? "font-semibold text-high" : ""}>
                      {isOverdue(task) ? "Overdue " : "Due "}
                      {formatTaskDate(task.dueDate, dateFormat)}
                      {task.dueTime && ` ${task.dueTime}`}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete "${task.title}"?`)) deleteTask.mutate(task.id);
                }}
                aria-label={`Delete "${task.title}"`}
              >
                Delete
              </Button>
            </div>
          );
        })}
      </div>

      {openTaskId && (
        <TaskDetailDrawer taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
      )}
    </>
  );
}
