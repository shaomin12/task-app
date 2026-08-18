import type { TaskStatus } from "@/lib/types";

export const STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLETED",
  "CANCELLED",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Haven't started",
  IN_PROGRESS: "Ongoing",
  UNDER_REVIEW: "Under review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Once a task is Submitted or Under review, it's out of your hands — the
// due date no longer marks it "overdue." Only Haven't started / Ongoing
// tasks can be overdue.
export const OVERDUE_ELIGIBLE_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS"];

// CSS custom property names (see app/globals.css) — the validated
// ordinal blue ramp for the workflow funnel, with Cancelled broken out
// in neutral gray since it sits outside the funnel.
export const STATUS_CHART_VAR: Record<TaskStatus, string> = {
  TODO: "--chart-todo",
  IN_PROGRESS: "--chart-in-progress",
  UNDER_REVIEW: "--chart-under-review",
  COMPLETED: "--chart-completed",
  CANCELLED: "--chart-cancelled",
};
