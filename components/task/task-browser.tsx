"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { TaskRows } from "@/components/task/task-rows";
import { Button } from "@/components/ui/button";
import {
  TaskFilterBar,
  DEFAULT_TASK_FILTERS,
  isDefaultTaskFilters,
  type TaskFilterState,
} from "@/components/task/task-filter-bar";
import { parsePriorityParam } from "@/lib/priority";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/status";
import type { ProjectDTO, TaskDTO, TaskStatus } from "@/lib/types";

type SortOption = "created" | "updated" | "due" | "priority" | "alpha" | "manual";

interface Filters extends TaskFilterState {
  sort: SortOption;
}

const TASK_QUERY_FAMILIES = ["tasks", "today", "upcoming", "projects"];

// Mirrors TASK_PAGE_SIZE in lib/tasks.ts — duplicated rather than imported
// since that module pulls in the Prisma client, which shouldn't end up in
// the browser bundle.
const PAGE_SIZE = 50;

async function fetchTasks(
  filters: Filters,
  page: number,
  lockedProjectId?: string,
  noProject?: boolean,
  lockedStatus?: TaskStatus
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  const status = lockedStatus ?? filters.status;
  if (status) params.set("status", status);
  if (filters.priority.length > 0) params.set("priority", filters.priority.join(","));
  if (filters.noDueDate) params.set("noDueDate", "true");
  if (noProject) {
    params.set("noProject", "true");
  } else {
    const projectId = lockedProjectId || filters.projectId;
    if (projectId) params.set("projectId", projectId);
  }
  params.set("sort", filters.sort);
  params.set("page", String(page));

  const res = await fetch(`/api/tasks?${params.toString()}`);
  if (!res.ok) throw new Error("Unable to load tasks. Please try again.");
  return res.json() as Promise<TaskDTO[]>;
}

export function TaskBrowser({
  initialTasks,
  projects,
  lockedProjectId,
  noProject,
  lockedStatus,
  defaultSort = "created",
  emptyMessage = "No tasks yet — add one above.",
}: {
  initialTasks: TaskDTO[];
  projects: ProjectDTO[];
  lockedProjectId?: string;
  noProject?: boolean;
  lockedStatus?: TaskStatus;
  defaultSort?: SortOption;
  emptyMessage?: string;
}) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const defaultFilters: Filters = { ...DEFAULT_TASK_FILTERS, sort: defaultSort };
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    status: searchParams.get("status") ?? "",
    priority: parsePriorityParam(searchParams.get("priority")),
    noDueDate: searchParams.get("noDueDate") === "true",
  }));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // The App Router reuses this component across same-route navigations (e.g.
  // clicking one Dashboard stat tile after another already landed here), so
  // the useState initializer above only ever applies on the very first
  // visit. Re-derive filters from the URL during render whenever its query
  // actually changes — React's endorsed way to adjust state on a changed
  // "prop" without an extra effect-triggered render.
  const searchParamsKey = searchParams.toString();
  const [syncedParamsKey, setSyncedParamsKey] = useState(searchParamsKey);
  if (searchParamsKey !== syncedParamsKey) {
    setSyncedParamsKey(searchParamsKey);
    setFilters((f) => ({
      ...f,
      status: searchParams.get("status") ?? "",
      priority: parsePriorityParam(searchParams.get("priority")),
      noDueDate: searchParams.get("noDueDate") === "true",
    }));
    setPage(1);
    setSelectedIds(new Set());
  }

  const isDefault = isDefaultTaskFilters(filters) && filters.sort === defaultSort;

  function updateFilters(next: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...next }));
    setPage(1);
  }

  const { data: tasks, error, isFetching } = useQuery({
    queryKey: ["tasks", lockedProjectId ?? (noProject ? "inbox" : "all"), lockedStatus, filters, page],
    queryFn: () => fetchTasks(filters, page, lockedProjectId, noProject, lockedStatus),
    initialData: isDefault && page === 1 ? initialTasks : undefined,
    placeholderData: keepPreviousData,
  });
  const hasMore = (tasks?.length ?? 0) >= page * PAGE_SIZE;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const invalidateAfterBulk = () => {
    setSelectedIds(new Set());
    queryClient.invalidateQueries({
      predicate: (q) => TASK_QUERY_FAMILIES.includes(q.queryKey[0] as string),
    });
  };

  const bulkSetStatus = useMutation({
    mutationFn: async (status: TaskStatus) => {
      const res = await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], status }),
      });
      if (!res.ok) throw new Error("Unable to update the selected tasks. Please try again.");
      return res.json();
    },
    onSuccess: invalidateAfterBulk,
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      if (!res.ok) throw new Error("Unable to delete the selected tasks. Please try again.");
      return res.json();
    },
    onSuccess: invalidateAfterBulk,
  });

  return (
    <div className="flex flex-col gap-4">
      <TaskFilterBar
        filters={filters}
        onChange={updateFilters}
        projects={projects}
        lockedProjectId={lockedProjectId}
        hideProjectFilter={noProject}
        hideStatusFilter={!!lockedStatus}
      >
        <select
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value as SortOption })}
          className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
        >
          <option value="created">Newest first</option>
          <option value="updated">Recently updated</option>
          <option value="due">By due date</option>
          <option value="priority">By priority</option>
          <option value="alpha">Alphabetical</option>
          <option value="manual">Manual order (set via Kanban)</option>
        </select>
      </TaskFilterBar>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-accent-soft p-3 text-sm">
          <span className="font-medium text-ink">{selectedIds.size} selected</span>
          <Button
            variant="ghost"
            disabled={bulkSetStatus.isPending}
            onClick={() => bulkSetStatus.mutate("COMPLETED")}
          >
            Complete
          </Button>
          <select
            defaultValue=""
            disabled={bulkSetStatus.isPending}
            onChange={(e) => {
              if (e.target.value) bulkSetStatus.mutate(e.target.value as TaskStatus);
              e.target.value = "";
            }}
            className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
          >
            <option value="" disabled>
              Set status…
            </option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <Button
            variant="danger"
            disabled={bulkDelete.isPending}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.size} selected task(s)?`)) {
                bulkDelete.mutate();
              }
            }}
          >
            Delete
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Clear selection
          </button>
          {(bulkSetStatus.isError || bulkDelete.isError) && (
            <span className="text-high">
              {((bulkSetStatus.error ?? bulkDelete.error) as Error).message}
            </span>
          )}
        </div>
      )}

      {error ? (
        <p className="text-sm text-high">{(error as Error).message}</p>
      ) : (
        <>
          <TaskRows
            tasks={tasks ?? []}
            emptyMessage={isDefault ? emptyMessage : "No tasks match your filters."}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="ghost" disabled={isFetching} onClick={() => setPage((p) => p + 1)}>
                {isFetching ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
