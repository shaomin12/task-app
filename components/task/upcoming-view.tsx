"use client";

import { useQuery } from "@tanstack/react-query";
import { TaskRows } from "@/components/task/task-rows";
import type { UpcomingView as UpcomingViewData } from "@/lib/tasks";

async function fetchUpcomingView(): Promise<UpcomingViewData> {
  const res = await fetch("/api/views/upcoming");
  if (!res.ok) throw new Error("Unable to load upcoming tasks. Please try again.");
  return res.json();
}

const SECTIONS = [
  { key: "tomorrow", title: "Tomorrow", empty: "Nothing due tomorrow." },
  { key: "thisWeek", title: "This Week", empty: "Nothing else due this week." },
  { key: "nextWeek", title: "Next Week", empty: "Nothing due next week." },
  { key: "later", title: "Later", empty: "Nothing further out." },
] as const;

export function UpcomingView({ initialView }: { initialView: UpcomingViewData }) {
  const { data, error } = useQuery({
    queryKey: ["upcoming"],
    queryFn: fetchUpcomingView,
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
