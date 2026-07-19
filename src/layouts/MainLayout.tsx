import { Outlet } from "react-router-dom";
import { SidebarNav } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function MainLayout() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <aside className="hidden h-full w-64 shrink-0 md:block">
        <SidebarNav />
      </aside>
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
