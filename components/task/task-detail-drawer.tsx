"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleCheck,
  Flag,
  Calendar as CalendarIcon,
  Clock,
  Folder,
  Tag as TagIcon,
  PenLine,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecurrenceSection } from "@/components/task/recurrence-section";
import { CommentsSection } from "@/components/task/comments-section";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/status";
import { formatTaskDate } from "@/lib/date-format";
import { useUserPrefs } from "@/lib/user-prefs-context";
import type { ProjectDTO, TaskDTO } from "@/lib/types";

function FieldLabel({ icon: Icon, children }: { icon: typeof CircleCheck; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

const TASK_QUERY_FAMILIES = ["tasks", "today", "upcoming", "projects"];

async function fetchTask(id: string): Promise<TaskDTO> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error("Unable to load task. Please try again.");
  return res.json();
}

async function fetchProjects(): Promise<ProjectDTO[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Unable to load projects. Please try again.");
  return res.json();
}

export function TaskDetailDrawer({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newSubtask, setNewSubtask] = useState("");
  const [tagsDraft, setTagsDraft] = useState<string | null>(null);
  const { dateFormat } = useUserPrefs();

  const { data: task, error } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
  });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const invalidate = () => {
    queryClient.invalidateQueries({
      predicate: (q) => TASK_QUERY_FAMILIES.includes(q.queryKey[0] as string),
    });
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
  };

  const updateTask = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Unable to save changes. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const duplicateTask = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Unable to duplicate task. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete task. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const addSubtask = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Unable to add subtask. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      setNewSubtask("");
      invalidate();
    },
  });

  const toggleSubtask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Unable to update subtask. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete subtask. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-rule-strong bg-surface p-6"
      >
        {error && <p className="text-sm text-high">{(error as Error).message}</p>}

        {!task ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-2">
              <input
                defaultValue={task.title}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== task.title &&
                  updateTask.mutate({ title: e.target.value.trim() })
                }
                className="flex-1 rounded-md border border-transparent bg-transparent font-display text-xl text-ink outline-none focus-visible:border-rule focus-visible:px-2"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close task details"
                className="rounded-md px-2 py-1 text-muted hover:bg-accent-soft hover:text-ink"
              >
                ✕
              </button>
            </div>

            <label className="mb-4 flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
              <FieldLabel icon={PenLine}>Description</FieldLabel>
              <textarea
                defaultValue={task.description ?? ""}
                placeholder="Add a description…"
                onBlur={(e) =>
                  e.target.value !== (task.description ?? "") &&
                  updateTask.mutate({ description: e.target.value || null })
                }
                rows={3}
                className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink normal-case outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
                <FieldLabel icon={CircleCheck}>Status</FieldLabel>
                <select
                  value={task.status}
                  onChange={(e) => updateTask.mutate({ status: e.target.value })}
                  className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink normal-case"
                >
                  {STATUS_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
                <FieldLabel icon={Flag}>Priority</FieldLabel>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask.mutate({ priority: e.target.value })}
                  className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink normal-case"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
                <FieldLabel icon={Folder}>Project</FieldLabel>
                <select
                  value={task.projectId ?? ""}
                  onChange={(e) =>
                    updateTask.mutate({ projectId: e.target.value || null })
                  }
                  className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink normal-case"
                >
                  <option value="">No project</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
                <FieldLabel icon={CalendarIcon}>Due date</FieldLabel>
                <input
                  type="date"
                  defaultValue={task.dueDate?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    updateTask.mutate({
                      dueDate: e.target.value || null,
                      ...(!e.target.value && { dueTime: null }),
                    })
                  }
                  className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink normal-case"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
                <FieldLabel icon={Clock}>Due time</FieldLabel>
                <input
                  type="time"
                  defaultValue={task.dueTime ?? ""}
                  disabled={!task.dueDate}
                  onChange={(e) => updateTask.mutate({ dueTime: e.target.value || null })}
                  className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink normal-case disabled:opacity-50"
                />
              </label>
            </div>

            {task.status === "IN_PROGRESS" && (
              <div className="mb-4">
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
                  Progress
                </span>
                <div className="flex gap-2">
                  {[30, 50, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateTask.mutate({ progressPercent: pct })}
                      className={`rounded-md border px-3 py-1.5 text-sm ${task.progressPercent === pct ? "border-accent bg-accent text-surface" : "border-rule text-muted hover:text-ink"}`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={task.progressPercent ?? ""}
                    placeholder="Custom %"
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number(e.target.value);
                      updateTask.mutate({ progressPercent: value });
                    }}
                    className="w-24 rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              </div>
            )}

            <label className="mb-4 flex flex-col gap-1 text-xs uppercase tracking-wide text-muted">
              <FieldLabel icon={TagIcon}>Tags (comma-separated)</FieldLabel>
              <input
                defaultValue={tagsDraft ?? task.tags.map((t) => t.name).join(", ")}
                onChange={(e) => setTagsDraft(e.target.value)}
                onBlur={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  updateTask.mutate({ tags });
                  setTagsDraft(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink normal-case outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>

            <RecurrenceSection taskId={taskId} task={task} onChange={invalidate} />

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wide text-muted">
                  <FieldLabel icon={ListTodo}>Subtasks</FieldLabel>
                </h3>
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted">
                    {task.subtasks.filter((s) => s.done).length} / {task.subtasks.length}
                  </span>
                )}
              </div>

              {task.subtasks.length > 0 && (
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-rule">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{
                      width: `${(task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100}%`,
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                {task.subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => toggleSubtask.mutate({ id: s.id, done: !s.done })}
                      className="h-4 w-4 accent-accent"
                    />
                    <span
                      className={`flex-1 text-sm text-ink ${s.done ? "text-muted line-through" : ""}`}
                    >
                      {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSubtask.mutate(s.id)}
                      aria-label={`Delete subtask "${s.title}"`}
                      className="text-xs text-muted hover:text-high"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newSubtask.trim()) addSubtask.mutate(newSubtask.trim());
                }}
                className="mt-2 flex gap-2"
              >
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask…"
                  className="flex-1 rounded-md border border-rule bg-surface px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
                <Button type="submit" variant="ghost">
                  Add
                </Button>
              </form>
            </div>

            <div className="mb-4 flex gap-2 border-t border-rule pt-4">
              <Button variant="ghost" onClick={() => duplicateTask.mutate()}>
                Duplicate
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete "${task.title}"?`)) deleteTask.mutate();
                }}
              >
                Delete task
              </Button>
            </div>

            <CommentsSection taskId={taskId} onChange={invalidate} />

            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-rule pt-4 text-xs text-muted">
              <span>Created {formatTaskDate(task.createdAt, dateFormat)}</span>
              <span>Updated {formatTaskDate(task.updatedAt, dateFormat)}</span>
              <span>
                Completed {task.completedAt ? formatTaskDate(task.completedAt, dateFormat) : "—"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
