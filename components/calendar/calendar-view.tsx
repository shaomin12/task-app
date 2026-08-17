"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskRows } from "@/components/task/task-rows";
import { Button } from "@/components/ui/button";
import { useUserPrefs } from "@/lib/user-prefs-context";
import type { ProjectDTO, TaskDTO } from "@/lib/types";

type Mode = "month" | "week" | "day";

const TASK_QUERY_FAMILIES = ["tasks", "today", "upcoming", "projects", "calendar"];

function fmt(date: Date) {
  return format(date, "yyyy-MM-dd");
}

async function fetchRange(start: Date, end: Date, projectId: string): Promise<TaskDTO[]> {
  const params = new URLSearchParams({ start: fmt(start), end: fmt(end) });
  if (projectId) params.set("projectId", projectId);
  const res = await fetch(`/api/views/calendar?${params.toString()}`);
  if (!res.ok) throw new Error("Unable to load calendar. Please try again.");
  return res.json();
}

export function CalendarView({
  initialTasks,
  projects,
}: {
  initialTasks: TaskDTO[];
  projects: ProjectDTO[];
}) {
  const { weekStartsOn } = useUserPrefs();
  const [mode, setMode] = useState<Mode>("month");
  const [current, setCurrent] = useState(() => new Date());
  const [projectId, setProjectId] = useState("");
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const queryClient = useQueryClient();

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (mode === "month") {
      return {
        rangeStart: startOfWeek(startOfMonth(current), { weekStartsOn }),
        rangeEnd: endOfWeek(endOfMonth(current), { weekStartsOn }),
      };
    }
    if (mode === "week") {
      return {
        rangeStart: startOfWeek(current, { weekStartsOn }),
        rangeEnd: endOfWeek(current, { weekStartsOn }),
      };
    }
    return { rangeStart: current, rangeEnd: current };
  }, [mode, current, weekStartsOn]);

  // Only the very first query (the range the server pre-fetched for) should
  // seed from initialTasks — later navigation must always hit the network,
  // or a stale dataset would flash in under the new range's key.
  const [initialKey] = useState(() => `${mode}:${fmt(rangeStart)}:${fmt(rangeEnd)}:`);
  const queryKey = ["calendar", mode, fmt(rangeStart), fmt(rangeEnd), projectId];

  const { data: tasks, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchRange(rangeStart, rangeEnd, projectId),
    initialData:
      !projectId && `${mode}:${fmt(rangeStart)}:${fmt(rangeEnd)}:` === initialKey
        ? initialTasks
        : undefined,
  });

  const createTask = useMutation({
    mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate }),
      });
      if (!res.ok) throw new Error("Unable to create task. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => TASK_QUERY_FAMILIES.includes(q.queryKey[0] as string),
      });
      setCreatingFor(null);
      setNewTaskTitle("");
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, TaskDTO[]>();
    for (const task of tasks ?? []) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn });
    return eachDayOfInterval({ start, end: addDays(start, 6) }).map((d) => format(d, "EEE"));
  }, [weekStartsOn]);

  function goPrev() {
    setCurrent((d) => (mode === "month" ? subMonths(d, 1) : mode === "week" ? subWeeks(d, 1) : subDays(d, 1)));
  }
  function goNext() {
    setCurrent((d) => (mode === "month" ? addMonths(d, 1) : mode === "week" ? addWeeks(d, 1) : addDays(d, 1)));
  }

  const label =
    mode === "month"
      ? format(current, "MMMM yyyy")
      : mode === "week"
        ? `${format(startOfWeek(current, { weekStartsOn }), "MMM d")} - ${format(endOfWeek(current, { weekStartsOn }), "MMM d, yyyy")}`
        : format(current, "EEEE, MMMM d, yyyy");

  const rangeNoun = mode === "month" ? "month" : mode === "week" ? "week" : "day";
  const taskCount = tasks?.length ?? 0;

  function submitCreate(dateKey: string) {
    if (newTaskTitle.trim()) {
      createTask.mutate({ title: newTaskTitle.trim(), dueDate: dateKey });
    } else {
      setCreatingFor(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={goPrev} aria-label="Previous">
            {"←"}
          </Button>
          <Button variant="ghost" onClick={() => setCurrent(new Date())}>
            Today
          </Button>
          <Button variant="ghost" onClick={goNext} aria-label="Next">
            {"→"}
          </Button>
          <span className="ml-2 font-display text-lg text-ink">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
              {taskCount} {taskCount === 1 ? "task" : "tasks"} this {rangeNoun}
            </span>
          )}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Filter by project"
            className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1 rounded-md border border-rule p-1">
            {(["month", "week", "day"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded px-3 py-1 text-sm capitalize ${mode === m ? "bg-accent text-surface" : "text-muted hover:text-ink"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading...</p>}

      {!isLoading && mode === "month" && (
        <div className="overflow-hidden rounded-xl border border-rule">
          <div className="grid grid-cols-7 border-b border-rule bg-surface text-center text-xs uppercase tracking-wide text-muted">
            {weekdayLabels.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((day) => {
              const dayKey = fmt(day);
              const dayTasks = byDay.get(dayKey) ?? [];
              const visible = dayTasks.slice(0, 3);
              const overflow = dayTasks.length - visible.length;
              const isCreating = creatingFor === dayKey;

              return (
                <div
                  key={day.toISOString()}
                  className={`group relative flex min-h-[96px] flex-col items-start gap-1 border-b border-r border-rule p-2 text-left last:border-r-0 ${isSameMonth(day, current) ? "bg-surface" : "bg-paper text-muted"}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrent(day);
                      setMode("day");
                    }}
                    className="absolute inset-0"
                    aria-label={`View ${format(day, "MMMM d, yyyy")}`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingFor(dayKey);
                      setNewTaskTitle("");
                    }}
                    aria-label={`Add task for ${format(day, "MMMM d, yyyy")}`}
                    className="absolute top-1 right-1 z-10 rounded p-0.5 text-muted opacity-0 hover:text-ink group-hover:opacity-100"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <span
                    className={`relative z-10 text-xs ${isToday(day) ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-surface" : "text-muted"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {visible.map((task) => (
                    <span key={task.id} className="relative z-10 flex w-full items-center gap-1 truncate text-xs text-ink">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: task.project?.color ?? "var(--color-muted)" }}
                      />
                      <span className="truncate">{task.title}</span>
                    </span>
                  ))}
                  {overflow > 0 && <span className="relative z-10 text-xs text-muted">+{overflow} more</span>}
                  {isCreating && (
                    <div
                      className="absolute top-6 left-1 z-20 w-48 rounded-md border border-rule bg-surface p-2 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitCreate(dayKey);
                          if (e.key === "Escape") setCreatingFor(null);
                        }}
                        onBlur={() => submitCreate(dayKey)}
                        placeholder="Task title…"
                        className="w-full rounded-md border border-rule bg-surface px-2 py-1 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && mode === "week" && (
        <div className="flex flex-col gap-6">
          {eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((day) => (
            <section key={day.toISOString()}>
              <h3 className="mb-2 font-display text-base text-ink">
                {format(day, "EEEE, MMM d")}
                {isToday(day) && <span className="ml-2 text-xs text-accent">Today</span>}
              </h3>
              <TaskRows
                tasks={byDay.get(fmt(day)) ?? []}
                emptyMessage="Nothing due this day."
              />
            </section>
          ))}
        </div>
      )}

      {!isLoading && mode === "day" && (
        <TaskRows tasks={byDay.get(fmt(current)) ?? []} emptyMessage="Nothing due this day." />
      )}
    </div>
  );
}
