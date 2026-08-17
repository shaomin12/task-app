import Link from "next/link";
import {
  LayoutDashboard,
  Sun,
  CalendarClock,
  ListTodo,
  Inbox as InboxIcon,
  CheckCheck,
  Kanban as KanbanIcon,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  Plus,
} from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import { getNavCounts, type NavCounts } from "@/lib/tasks";
import { QuickAdd } from "@/components/layout/quick-add";
import { NavLink } from "@/components/layout/nav-link";

const NAV_LINKS: {
  href: string;
  label: string;
  countKey?: keyof NavCounts;
  icon: typeof LayoutDashboard;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", countKey: "inbox", icon: InboxIcon },
  { href: "/today", label: "Today", countKey: "today", icon: Sun },
  { href: "/upcoming", label: "Upcoming", countKey: "upcoming", icon: CalendarClock },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/tasks", label: "All Tasks", countKey: "allTasks", icon: ListTodo },
  { href: "/completed", label: "Completed", countKey: "completed", icon: CheckCheck },
  { href: "/kanban", label: "Kanban", icon: KanbanIcon },
];

export async function Sidebar() {
  const user = await getCurrentUser();
  const [projects, counts] = await Promise.all([
    listProjectsForUser(user.id),
    getNavCounts(user.id),
  ]);

  const displayName = user.name ?? user.email ?? "Your workspace";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-rule-strong bg-surface sm:flex">
      <div className="flex items-center gap-3 border-b border-rule px-5 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-surface">
          {initial}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-display text-lg text-ink">{displayName}</p>
          <p className="text-[10px] font-medium tracking-widest text-muted">WORKSPACE</p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <SettingsIcon className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>

      <div className="border-b border-rule px-4 py-4">
        <QuickAdd defaultPriority={user.defaultPriority} fullWidth />
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-0.5 px-3 py-4 text-sm">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            block
            icon={<link.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            count={link.countKey ? counts[link.countKey] : undefined}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto border-t border-rule px-3 py-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Projects
          </span>
          <Link
            href="/projects"
            aria-label="Manage projects"
            className="text-muted hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
        <div className="flex flex-col gap-0.5">
          {projects.length === 0 ? (
            <p className="px-2 text-xs italic text-muted">No projects yet.</p>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-ink"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-xs">{p.taskCount}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
