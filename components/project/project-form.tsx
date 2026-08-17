"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/lib/types";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string(),
  tagsInput: z.string(),
});

type FormValues = z.infer<typeof projectFormSchema>;

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

async function createProject(values: FormValues) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: values.name,
      color: values.color,
      tags: values.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to create project. Please try again.");
  }
  return res.json() as Promise<ProjectDTO>;
}

export function ProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", color: SWATCHES[0], tagsInput: "" },
  });

  const selectedColor = watch("color");

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      reset({ name: "", color: SWATCHES[0], tagsInput: "" });
      router.refresh();
    },
    onError: (err: Error) => setError("root", { message: err.message }),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-rule bg-surface p-4"
    >
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Project name
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Finance"
          className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-high">{errors.name.message}</p>
        )}
      </div>

      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Color
        </span>
        <div className="flex gap-1.5 pb-1.5">
          {SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("color", color)}
              aria-label={`Choose color ${color}`}
              className={`h-6 w-6 rounded-full ring-offset-2 ${selectedColor === color ? "ring-2 ring-accent" : ""}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Tags
        </label>
        <input
          {...register("tagsInput")}
          placeholder="work, urgent"
          className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "New project"}
      </Button>

      {errors.root && (
        <p className="w-full text-sm text-high">{errors.root.message}</p>
      )}
    </form>
  );
}
