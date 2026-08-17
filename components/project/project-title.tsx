"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function ProjectTitle({
  projectId,
  initialName,
}: {
  projectId: string;
  initialName: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Unable to save name. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.refresh();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="min-w-0 flex-1">
      <input
        defaultValue={initialName}
        onBlur={(e) => {
          const value = e.target.value.trim();
          if (value && value !== initialName) {
            update.mutate(value);
          } else if (!value) {
            e.target.value = initialName;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-full truncate rounded-md border border-transparent bg-transparent font-display text-2xl text-ink outline-none focus-visible:border-rule focus-visible:px-2"
      />
      {error && <p className="text-xs text-high">{error}</p>}
    </div>
  );
}
