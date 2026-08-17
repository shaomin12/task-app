"use client";

import type { ReactNode } from "react";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/status";
import { PRIORITY_ORDER, PRIORITY_LABELS, type PriorityValue } from "@/lib/priority";
import type { ProjectDTO } from "@/lib/types";

export interface TaskFilterState {
  q: string;
  status: string;
  priority: PriorityValue[];
  projectId: string;
}

export const DEFAULT_TASK_FILTERS: TaskFilterState = {
  q: "",
  status: "",
  priority: [],
  projectId: "",
};

export function isDefaultTaskFilters(filters: TaskFilterState) {
  return (
    filters.q === "" &&
    filters.status === "" &&
    filters.priority.length === 0 &&
    filters.projectId === ""
  );
}

export function TaskFilterBar({
  filters,
  onChange,
  projects,
  lockedProjectId,
  hideProjectFilter,
  hideStatusFilter,
  children,
}: {
  filters: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  projects: ProjectDTO[];
  lockedProjectId?: string;
  hideProjectFilter?: boolean;
  hideStatusFilter?: boolean;
  children?: ReactNode;
}) {
  function togglePriority(value: PriorityValue) {
    onChange({
      ...filters,
      priority: filters.priority.includes(value)
        ? filters.priority.filter((p) => p !== value)
        : PRIORITY_ORDER.filter((p) => p === value || filters.priority.includes(p)),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-surface p-3">
      <input
        type="search"
        value={filters.q}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
        placeholder="Search title, description, tags, project…"
        className="min-w-[200px] flex-1 rounded-md border border-rule bg-surface px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {!hideStatusFilter && (
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
        >
          <option value="">Any status</option>
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      )}
      <div
        role="group"
        aria-label="Filter by priority (select any number)"
        className="flex gap-1 rounded-md border border-rule p-1"
      >
        {PRIORITY_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => togglePriority(value)}
            aria-pressed={filters.priority.includes(value)}
            className={`rounded px-2 py-1 text-xs ${filters.priority.includes(value) ? "bg-accent text-surface" : "text-muted hover:text-ink"}`}
          >
            {PRIORITY_LABELS[value]}
          </button>
        ))}
      </div>
      {!lockedProjectId && !hideProjectFilter && (
        <select
          value={filters.projectId}
          onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
          className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
        >
          <option value="">Any project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      {children}
      {!isDefaultTaskFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_TASK_FILTERS)}
          className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
