"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, CalendarClock, ListTodo, MoreHorizontal } from "lucide-react";

const PRIMARY = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/upcoming", label: "Upcoming", icon: CalendarClock },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
];

const MORE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/calendar", label: "Calendar" },
  { href: "/completed", label: "Completed" },
  { href: "/kanban", label: "Kanban" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 sm:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 bottom-16 left-0 rounded-t-xl border-t border-rule-strong bg-surface p-2 pb-[env(safe-area-inset-bottom)]"
          >
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                aria-current={pathname.startsWith(link.href) ? "page" : undefined}
                className={`block rounded-md px-4 py-3 text-sm ${pathname.startsWith(link.href) ? "bg-accent-soft text-ink" : "text-muted"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-rule-strong bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {PRIMARY.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${isActive ? "font-medium text-accent" : "text-muted"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="More navigation options"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${moreOpen ? "font-medium text-accent" : "text-muted"}`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
          More
        </button>
      </nav>
    </>
  );
}
