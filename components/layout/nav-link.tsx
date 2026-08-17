"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  children,
  block = false,
  count,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  block?: boolean;
  count?: number;
  icon?: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  if (block) {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${isActive ? "bg-accent-soft font-medium text-ink" : "text-muted hover:bg-accent-soft hover:text-ink"}`}
      >
        <span className="flex items-center gap-2.5">
          {icon}
          <span>{children}</span>
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-xs tabular-nums text-muted">{count}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`transition-colors ${isActive ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
