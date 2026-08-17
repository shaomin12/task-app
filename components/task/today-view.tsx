"use client";

import { useQuery } from "@tanstack/react-query";
import { TaskRows } from "@/components/task/task-rows";
import type { TodayView as TodayViewData } from "@/lib/tasks";

async function fetchTodayView(): Promise<TodayViewData> {
  const res = await fetch("/api/views/today");
  if (!res.ok) throw new Error("Unable to load today's tasks. Please try again.");
  return res.json();
}

const SECTIONS = [
  { key: "overdue", title: "Overdue", empty: "Nothing overdue — nicely done." },
  { key: "dueToday", title: "Due Today", empty: "No tasks due today." },
  { key: "highPriority", title: "High Priority", empty: "No other high-priority tasks." },
  { key: "completedToday", title: "Completed Today", empty: "Nothing completed yet today." },
] as const;

export function TodayView({ initialView }: { initialView: TodayViewData }) {
  const { data, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchTodayView,
    initialData: initialView,
  });

  if (error) {
    return <p className="text-sm text-high">{(error as Error).message}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {SECTIONS.map((section) => (
        <section key={section.key}>
          <h2 className="mb-2 font-display text-lg text-ink">{section.title}</h2>
          <TaskRows tasks={data[section.key]} emptyMessage={section.empty} />
        </section>
      ))}
    </div>
  );
}
