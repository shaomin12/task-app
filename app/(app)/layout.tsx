import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-8 pb-24 sm:pb-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
