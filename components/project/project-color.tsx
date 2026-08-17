"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const SWATCHES = [
  "#e0447e", // hot pink
  "#f2703c", // tangerine
  "#f2b705", // marigold
  "#4caf50", // grass green
  "#16a3a3", // turquoise
  "#3b82f6", // sky blue
  "#8b5cf6", // grape violet
  "#d6409f", // magenta
];

export function ProjectColor({
  projectId,
  initialColor,
}: {
  projectId: string;
  initialColor: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(initialColor);

  const update = useMutation({
    mutationFn: async (nextColor: string) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: nextColor }),
      });
      if (!res.ok) throw new Error("Unable to save color. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.refresh();
    },
  });

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change project color"
        title="Change project color"
        className="h-3.5 w-3.5 rounded-full ring-offset-2 hover:ring-2 hover:ring-accent"
        style={{ backgroundColor: color }}
      />
      {open && (
        <div className="absolute top-6 left-0 z-10 flex gap-1.5 rounded-md border border-rule bg-surface p-2 shadow-sm">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => {
                setColor(swatch);
                update.mutate(swatch);
                setOpen(false);
              }}
              aria-label={`Choose color ${swatch}`}
              className={`h-6 w-6 rounded-full ring-offset-2 ${color === swatch ? "ring-2 ring-accent" : ""}`}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
