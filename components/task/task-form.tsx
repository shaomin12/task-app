"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { ProjectDTO, TaskDTO } from "@/lib/types";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  projectId: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string(),
  dueTime: z.string(),
  tagsInput: z.string(),
});

type FormValues = z.infer<typeof taskFormSchema>;

async function createTask(values: FormValues) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: values.title,
      projectId: values.projectId || null,
      priority: values.priority,
      dueDate: values.dueDate || null,
      dueTime: values.dueDate && values.dueTime ? values.dueTime : null,
      tags: values.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to create task. Please try again.");
  }
  return res.json() as Promise<TaskDTO>;
}

export function TaskForm({
  projects,
  defaultProjectId,
  preselectProjectId,
  defaultPriority = "MEDIUM",
}: {
  projects: ProjectDTO[];
  // Locks the project to this value and hides the picker entirely (Project Detail page).
  defaultProjectId?: string;
  // Pre-selects this project but leaves the picker visible/editable (Settings' Default project).
  preselectProjectId?: string;
  defaultPriority?: FormValues["priority"];
}) {
  const queryClient = useQueryClient();
  const initialProjectId = defaultProjectId ?? preselectProjectId ?? "";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      projectId: initialProjectId,
      priority: defaultPriority,
      dueDate: "",
      dueTime: "",
      tagsInput: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      reset({
        title: "",
        projectId: initialProjectId,
        priority: defaultPriority,
        dueDate: "",
        dueTime: "",
        tagsInput: "",
      });
    },
    onError: (err: Error) => setError("root", { message: err.message }),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-rule bg-surface p-4"
    >
      <div className="min-w-[220px] flex-1">
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Task
        </label>
        <input
          {...register("title")}
          placeholder="What needs doing?"
          className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-high">{errors.title.message}</p>
        )}
      </div>

      {projects.length > 0 && !defaultProjectId && (
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Project
          </label>
          <select
            {...register("projectId")}
            className="rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Priority
        </label>
        <select
          {...register("priority")}
          className="rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Due
        </label>
        <div className="flex gap-1.5">
          <input
            type="date"
            {...register("dueDate")}
            className="rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink"
          />
          <input
            type="time"
            {...register("dueTime")}
            aria-label="Due time"
            className="rounded-md border border-rule bg-surface px-2 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <div className="min-w-[140px]">
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
        {isSubmitting ? "Adding…" : "Add task"}
      </Button>

      {errors.root && (
        <p className="w-full text-sm text-high">{errors.root.message}</p>
      )}
    </form>
  );
}
