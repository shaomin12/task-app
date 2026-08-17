import { Flame, CalendarClock, CalendarX2, Eye } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboardStats, getWeekStats, getStatusBreakdown } from "@/lib/tasks";
import { listArchivedProjectsForUser } from "@/lib/projects";
import { StatTile } from "@/components/dashboard/stat-tile";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { ArchivedProjects } from "@/components/project/archived-projects";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [stats, weekStats, statusBreakdown, archivedProjects] = await Promise.all([
    getDashboardStats(user.id),
    getWeekStats(user.id, user.weekStartsOn === 0 ? 0 : 1),
    getStatusBreakdown(user.id),
    listArchivedProjectsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-ink">
          Welcome back, {user.name ?? user.email}
        </h1>
        <p className="text-sm text-muted">Here&apos;s where things stand this week.</p>
      </div>

      <WeekOverview stats={weekStats} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="High Priority"
          value={stats.highPriorityCount}
          href="/tasks?priority=HIGH,URGENT"
          accent="medium"
          icon={Flame}
        />
        <StatTile
          label="Upcoming"
          value={stats.upcomingCount}
          href="/upcoming"
          icon={CalendarClock}
        />
        <StatTile
          label="No Due Date"
          value={stats.noDueDateCount}
          href="/tasks"
          icon={CalendarX2}
        />
        <StatTile
          label="Under Review"
          value={stats.underReviewCount}
          href="/tasks?status=UNDER_REVIEW"
          icon={Eye}
        />
      </div>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted">
          Status breakdown — all tasks
        </h2>
        <StatusPieChart breakdown={statusBreakdown} />
      </section>

      <section>
        {archivedProjects.length > 0 ? (
          <ArchivedProjects initialProjects={archivedProjects} />
        ) : (
          <details className="rounded-xl border border-rule bg-surface p-4">
            <summary className="cursor-pointer text-sm text-muted">Archived projects (0)</summary>
            <p className="mt-3 text-sm italic text-muted">No archived projects yet.</p>
          </details>
        )}
      </section>
    </div>
  );
}
