"use client";

import { useState } from "react";
import { STATUS_CHART_VAR, STATUS_LABELS, STATUS_ORDER } from "@/lib/status";
import type { StatusBreakdown } from "@/lib/tasks";

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = 56;
const STROKE = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEG = 3;

export function StatusPieChart({ breakdown }: { breakdown: StatusBreakdown[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const visible = breakdown.filter((b) => b.count > 0);
  const total = visible.reduce((sum, b) => sum + b.count, 0);

  if (total === 0) {
    return (
      <p className="rounded-xl border border-rule bg-surface p-8 text-center text-sm italic text-muted">
        No tasks yet — the status breakdown will appear here once you have some.
      </p>
    );
  }

  const gapLength = (GAP_DEG / 360) * CIRCUMFERENCE;
  const rawLengths = visible.map((b) => (b.count / total) * CIRCUMFERENCE);
  const segments = visible.map((b, i) => {
    const rawLength = rawLengths[i];
    const cumulative = rawLengths.slice(0, i).reduce((sum, len) => sum + len, 0);
    const drawLength = visible.length > 1 ? Math.max(rawLength - gapLength, 0) : rawLength;
    return {
      ...b,
      drawLength,
      offset: -cumulative,
      percent: Math.round((b.count / total) * 100),
    };
  });

  const active = segments.find((s) => s.status === hovered) ?? null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative mx-auto h-40 w-40 shrink-0" aria-hidden="true">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth={STROKE}
          />
          {segments.map((s) => (
            <circle
              key={s.status}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={`var(${STATUS_CHART_VAR[s.status]})`}
              strokeWidth={hovered === s.status ? STROKE + 4 : STROKE}
              strokeLinecap="round"
              strokeDasharray={`${s.drawLength} ${CIRCUMFERENCE - s.drawLength}`}
              strokeDashoffset={s.offset}
              opacity={hovered && hovered !== s.status ? 0.45 : 1}
              onMouseEnter={() => setHovered(s.status)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl text-ink">
            {active ? active.count : total}
          </span>
          <span className="text-xs text-muted">
            {active ? STATUS_LABELS[active.status] : "tasks"}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <ul className="flex flex-col gap-1.5">
          {STATUS_ORDER.filter((status) => breakdown.some((b) => b.status === status && b.count > 0)).map(
            (status) => {
              const s = segments.find((seg) => seg.status === status)!;
              return (
                <li
                  key={status}
                  onMouseEnter={() => setHovered(status)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${hovered === status ? "bg-accent-soft" : ""}`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(${STATUS_CHART_VAR[status]})` }}
                  />
                  <span className="flex-1 text-ink">{STATUS_LABELS[status]}</span>
                  <span className="text-muted">
                    {s.count} · {s.percent}%
                  </span>
                </li>
              );
            }
          )}
        </ul>
      </div>

      <table className="sr-only">
        <caption>Task status breakdown</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Count</th>
            <th scope="col">Percent</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.status}>
              <td>{STATUS_LABELS[s.status]}</td>
              <td>{s.count}</td>
              <td>{s.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
