import Link from "next/link";
import type { WeekStats } from "@/lib/tasks";

function isTodayKey(dateKey: string) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dateKey === todayKey;
}

export function WeekOverview({ stats }: { stats: WeekStats }) {
  const maxCount = Math.max(1, ...stats.dailyBreakdown.map((d) => d.count));

  return (
    <section className="rounded-xl border border-rule bg-surface p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-muted">This Week</h2>
          <p className="mt-1 font-display text-4xl text-ink">
            {stats.totalWeek} {stats.totalWeek === 1 ? "task" : "tasks"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {stats.completedWeek} completed &middot; {stats.remainingWeek} remaining
            {stats.overdueCount > 0 && (
              <>
                {" "}
                &middot;{" "}
                <Link href="/today" className="font-medium text-high hover:underline">
                  {stats.overdueCount} overdue
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-display text-2xl text-accent">{stats.progressPct}%</span>
          <span className="text-xs text-muted">progress</span>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-rule">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${stats.progressPct}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {stats.dailyBreakdown.map((day) => {
          const today = isTodayKey(day.date);
          const barHeight = day.count === 0 ? 0 : Math.max(8, (day.count / maxCount) * 32);

          return (
            <div key={day.date} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs uppercase tracking-wide ${today ? "font-semibold text-accent" : "text-muted"}`}>
                {day.label}
              </span>
              <div className="flex h-8 w-full items-end justify-center">
                <div
                  className={`w-4 rounded-t-sm ${day.count === 0 ? "bg-rule" : today ? "bg-accent" : "bg-accent-soft"}`}
                  style={{ height: `${barHeight}px` }}
                />
              </div>
              <span className={`text-xs tabular-nums ${today ? "font-semibold text-ink" : "text-muted"}`}>
                {day.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
