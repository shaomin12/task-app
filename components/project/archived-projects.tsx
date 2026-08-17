"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/lib/types";

async function fetchArchivedProjects(): Promise<ProjectDTO[]> {
  const res = await fetch("/api/projects?archived=true");
  if (!res.ok) throw new Error("Unable to load archived projects. Please try again.");
  return res.json();
}

function useArchivedProjects(initialProjects: ProjectDTO[]) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["projects", "archived"],
    queryFn: fetchArchivedProjects,
    initialData: initialProjects,
  });

  const unarchive = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) throw new Error("Unable to restore project. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.refresh();
    },
  });

  return { projects: projects ?? [], unarchive };
}

function ProjectRow({ project, onRestore }: { project: ProjectDTO; onRestore: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-rule p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <span className="truncate text-sm text-ink">{project.name}</span>
        <span className="shrink-0 text-xs text-muted">
          {project.completedTaskCount} / {project.taskCount} completed
        </span>
      </div>
      <Button variant="ghost" onClick={onRestore}>
        Restore
      </Button>
    </div>
  );
}

// Collapsible variant — used on the Dashboard, where archived projects are a
// secondary, tucked-away detail rather than the whole page's focus.
export function ArchivedProjects({ initialProjects }: { initialProjects: ProjectDTO[] }) {
  const { projects, unarchive } = useArchivedProjects(initialProjects);

  if (projects.length === 0) return null;

  return (
    <details className="rounded-xl border border-rule bg-surface p-4">
      <summary className="cursor-pointer text-sm text-muted">
        Archived projects ({projects.length})
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        {projects.map((project) => (
          <ProjectRow key={project.id} project={project} onRestore={() => unarchive.mutate(project.id)} />
        ))}
      </div>
    </details>
  );
}

// Flat variant — used on the Projects page's own "Archived" tab, where the
// tab selection already does the hiding, so a second collapse would be redundant.
export function ArchivedProjectsList({ initialProjects }: { initialProjects: ProjectDTO[] }) {
  const { projects, unarchive } = useArchivedProjects(initialProjects);

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-rule bg-surface p-8 text-center text-sm italic text-muted">
        No archived projects.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} onRestore={() => unarchive.mutate(project.id)} />
      ))}
    </div>
  );
}
