"use client";

import { useState } from "react";
import { ProjectForm } from "@/components/project/project-form";
import { ProjectList } from "@/components/project/project-list";
import { ArchivedProjectsList } from "@/components/project/archived-projects";
import type { ProjectDTO } from "@/lib/types";

export function ProjectsTabs({
  activeProjects,
  archivedProjects,
}: {
  activeProjects: ProjectDTO[];
  archivedProjects: ProjectDTO[];
}) {
  const [tab, setTab] = useState<"active" | "archived">("active");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-fit gap-1 rounded-md border border-rule p-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded px-4 py-1.5 text-sm ${tab === "active" ? "bg-accent text-surface" : "text-muted hover:text-ink"}`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setTab("archived")}
          className={`rounded px-4 py-1.5 text-sm ${tab === "archived" ? "bg-accent text-surface" : "text-muted hover:text-ink"}`}
        >
          Archived{archivedProjects.length > 0 ? ` (${archivedProjects.length})` : ""}
        </button>
      </div>

      {tab === "active" ? (
        <>
          <ProjectForm />
          <ProjectList initialProjects={activeProjects} />
        </>
      ) : (
        <ArchivedProjectsList initialProjects={archivedProjects} />
      )}
    </div>
  );
}
