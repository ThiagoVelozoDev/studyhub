import { Outlet } from "react-router-dom";
import { SidebarNav } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { cn } from "@/utils/cn";

export default function MainLayout() {
  useKeyboardShortcuts();
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();

  return (
    <div className="flex h-svh overflow-hidden bg-background print:h-auto print:overflow-visible">
      <aside
        className={cn(
          "hidden h-full shrink-0 transition-[width] duration-200 md:block print:hidden",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarNav collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>
      <div className="flex h-full min-w-0 flex-1 flex-col print:h-auto">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
