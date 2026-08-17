import type { Priority } from "@/lib/types";

export type PriorityValue = Priority;

export const PRIORITY_ORDER: PriorityValue[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const PRIORITY_LABELS: Record<PriorityValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function parsePriorityParam(value: string | null): PriorityValue[] {
  if (!value) return [];
  const requested = new Set(value.split(","));
  return PRIORITY_ORDER.filter((p) => requested.has(p));
}
