import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  href,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  accent?: "high" | "medium" | "accent";
  icon: LucideIcon;
}) {
  const valueColor =
    accent === "high" ? "text-high" : accent === "medium" ? "text-medium" : "text-ink";
  const iconWrap =
    accent === "high"
      ? "bg-danger-soft text-high"
      : accent === "medium"
        ? "bg-accent-soft text-medium"
        : "bg-accent-soft text-accent";

  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-xl border border-rule bg-surface p-4 transition-colors hover:border-rule-strong"
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconWrap}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={`font-display text-2xl ${valueColor}`}>{value}</span>
        <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      </div>
    </Link>
  );
}
