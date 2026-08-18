"use client";

import { usePathname } from "next/navigation";

// Most pages read as a document, so they're capped at a comfortable reading
// width. Kanban is a workspace instead — it needs the full available width
// so all 6 status columns fit without horizontal scrolling.
const FULL_WIDTH_ROUTES = ["/kanban"];

export function PageWidth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.some((route) => pathname.startsWith(route));

  return <div className={isFullWidth ? "w-full" : "mx-auto max-w-5xl"}>{children}</div>;
}
