"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/lib/types";

async function fetchProjects(): Promise<ProjectDTO[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Unable to load projects. Please try again.");
  return res.json();
}

export function ProjectList({ initialProjects }: { initialProjects: ProjectDTO[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: projects, error } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    initialData: initialProjects,
  });

  const filtered = projects.filter((project) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      project.name.toLowerCase().includes(q) ||
      project.tags.some((tag) => tag.name.toLowerCase().includes(q))
    );
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({
      predicate: (q) => ["tasks", "today", "upcoming"].includes(q.queryKey[0] as string),
    });
    router.refresh();
  };

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (!res.ok) throw new Error("Unable to archive project. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete project. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  if (error) {
    return <p className="text-sm text-high">{(error as Error).message}</p>;
  }

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-rule bg-surface p-8 text-center text-sm italic text-muted">
        You don&apos;t have any projects yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search projects or tags…"
        className="w-full max-w-sm rounded-md border border-rule bg-surface px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {filtered.length === 0 && (
        <p className="rounded-xl border border-rule bg-surface p-8 text-center text-sm italic text-muted">
          No projects match &quot;{query}&quot;.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((project) => (
        <div
          key={project.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-rule bg-surface p-4"
        >
          <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate text-sm font-medium text-ink">
                {project.name}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {project.completedTaskCount} / {project.taskCount} completed
            </p>
            {project.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full px-1.5 py-0.5 text-xs"
                    style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              onClick={() => {
                if (window.confirm(`Archive "${project.name}"? It will no longer appear in your project list.`)) {
                  archive.mutate(project.id);
                }
              }}
            >
              Archive
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${project.name}"? Its tasks will be kept but unassigned from any project. This can't be undone.`
                  )
                ) {
                  deleteProject.mutate(project.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
