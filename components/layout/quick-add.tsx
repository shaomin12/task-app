"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Priority } from "@/lib/types";

const TASK_QUERY_FAMILIES = ["tasks", "today", "upcoming", "projects"];

export function QuickAdd({
  defaultPriority = "MEDIUM",
  fullWidth = false,
}: {
  defaultPriority?: Priority;
  fullWidth?: boolean;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value, priority: defaultPriority }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to add task. Please try again.");
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      setError(null);
      queryClient.invalidateQueries({
        predicate: (q) => TASK_QUERY_FAMILIES.includes(q.queryKey[0] as string),
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) mutation.mutate(title.trim());
      }}
      className={fullWidth ? "w-full" : "flex items-center gap-2"}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="+ New task"
        title="Type a title and press Enter. Smart parsing of dates, #tags, and priority is coming soon — use a task's detail view or the full form for those."
        className={
          fullWidth
            ? "w-full rounded-md border border-accent bg-accent-soft px-3 py-2 text-sm font-medium text-ink outline-none placeholder:text-ink placeholder:opacity-70 focus-visible:ring-2 focus-visible:ring-accent"
            : "w-56 rounded-md border border-rule bg-paper px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        }
      />
      {error && <span className="mt-1 block text-xs text-high">{error}</span>}
    </form>
  );
}
