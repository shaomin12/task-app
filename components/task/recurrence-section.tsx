"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Repeat as RepeatIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecurrencePattern, TaskDTO } from "@/lib/types";

const PATTERNS: { value: RecurrencePattern; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKDAYS", label: "Weekdays" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
];

const CUSTOM_UNITS: { value: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"; label: string; plural: string }[] = [
  { value: "DAILY", label: "Day", plural: "days" },
  { value: "WEEKLY", label: "Week", plural: "weeks" },
  { value: "MONTHLY", label: "Month", plural: "months" },
  { value: "YEARLY", label: "Year", plural: "years" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PATTERN_LABELS: Record<RecurrencePattern, string> = {
  DAILY: "Daily",
  WEEKDAYS: "Weekdays",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  CUSTOM: "Custom",
};

export function RecurrenceSection({
  taskId,
  task,
  onChange,
}: {
  taskId: string;
  task: TaskDTO;
  onChange: () => void;
}) {
  const [pattern, setPattern] = useState<RecurrencePattern>("WEEKLY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("WEEKLY");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setRecurrence = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/recurrence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern,
          daysOfWeek: pattern === "WEEKLY" ? daysOfWeek : undefined,
          interval: pattern === "CUSTOM" ? customInterval : undefined,
          customUnit: pattern === "CUSTOM" ? customUnit : undefined,
          endDate: endDate || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to set recurrence. Please try again.");
      }
      return res.json();
    },
    onSuccess: () => {
      setError(null);
      onChange();
    },
    onError: (err: Error) => setError(err.message),
  });

  const stopRecurrence = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/recurrence`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to stop recurrence. Please try again.");
      return res.json();
    },
    onSuccess: onChange,
  });

  function toggleDay(day: number) {
    setDaysOfWeek((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    );
  }

  if (task.recurringTask) {
    const rt = task.recurringTask;
    const customUnitLabel = CUSTOM_UNITS.find((u) => u.value === rt.customUnit);
    return (
      <div className="mb-4 rounded-md border border-rule p-3">
        <h3 className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted">
          <RepeatIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Repeats
        </h3>
        <p className="text-sm text-ink">
          {rt.pattern === "CUSTOM" && customUnitLabel
            ? `Every ${rt.interval} ${rt.interval === 1 ? customUnitLabel.label.toLowerCase() : customUnitLabel.plural}`
            : PATTERN_LABELS[rt.pattern]}
          {rt.pattern === "WEEKLY" && rt.daysOfWeek.length > 0 && (
            <> on {rt.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(", ")}</>
          )}
          {rt.endDate && <> until {rt.endDate.slice(0, 10)}</>}
        </p>
        <p className="mt-1 text-xs text-muted">
          Completing this task creates the next occurrence automatically.
        </p>
        <Button variant="ghost" className="mt-2" onClick={() => stopRecurrence.mutate()}>
          Stop repeating
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-md border border-rule p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted">
        <RepeatIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        Repeat
      </h3>
      {!task.dueDate ? (
        <p className="text-xs italic text-muted">Set a due date to make this task recurring.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as RecurrencePattern)}
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
            >
              {PATTERNS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Optional end date"
              className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
            />
            <Button variant="ghost" disabled={setRecurrence.isPending} onClick={() => setRecurrence.mutate()}>
              Make recurring
            </Button>
          </div>

          {pattern === "WEEKLY" && (
            <div className="mt-2 flex gap-1">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-7 w-9 rounded text-xs ${daysOfWeek.includes(day) ? "bg-accent text-surface" : "border border-rule text-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {pattern === "CUSTOM" && (
            <div className="mt-2 flex items-center gap-2 text-sm text-ink">
              <span className="text-xs text-muted">Every</span>
              <input
                type="number"
                min={1}
                max={52}
                value={customInterval}
                onChange={(e) => setCustomInterval(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-md border border-rule bg-surface px-2 py-1 text-sm text-ink"
              />
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as typeof customUnit)}
                className="rounded-md border border-rule bg-surface px-2 py-1 text-sm text-ink"
              >
                {CUSTOM_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {customInterval === 1 ? u.label : u.plural}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-high">{error}</p>}
        </>
      )}
    </div>
  );
}
