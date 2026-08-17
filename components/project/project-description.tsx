"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function ProjectDescription({
  projectId,
  initialDescription,
}: {
  projectId: string;
  initialDescription: string | null;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Unable to save description. Please try again.");
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
        <textarea
          defaultValue={initialDescription ?? ""}
          autoFocus
          rows={2}
          placeholder="Add a description…"
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value !== (initialDescription ?? "")) {
              update.mutate(value);
            } else {
              setEditing(false);
            }
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
      className="-mt-2 text-left text-sm text-muted hover:text-ink"
    >
      {initialDescription || (
        <span className="italic">Add a description…</span>
      )}
    </button>
  );
}
