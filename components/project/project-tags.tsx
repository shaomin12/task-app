"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TagDTO } from "@/lib/types";

export function ProjectTags({
  projectId,
  initialTags,
}: {
  projectId: string;
  initialTags: TagDTO[];
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialText = initialTags.map((t) => t.name).join(", ");

  const update = useMutation({
    mutationFn: async (tags: string[]) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error("Unable to save tags. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      setError(null);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  if (editing) {
    return (
      <div className="-mt-2 flex flex-col gap-2">
        <input
          defaultValue={initialText}
          autoFocus
          placeholder="Tags, comma-separated…"
          onBlur={(e) => {
            const tags = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            if (tags.join(", ") !== initialText) {
              update.mutate(tags);
            } else {
              setEditing(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {error && <p className="text-xs text-high">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="-mt-2 flex flex-wrap items-center gap-1.5 text-left text-sm"
    >
      {initialTags.length === 0 ? (
        <span className="italic text-muted">Add tags…</span>
      ) : (
        initialTags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
          >
            #{tag.name}
          </span>
        ))
      )}
    </button>
  );
}
