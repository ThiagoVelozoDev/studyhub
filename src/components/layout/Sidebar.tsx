import { NavLink } from "react-router-dom";
import { BrainCircuit, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navigation";
import { MotivationalBanner } from "@/components/dashboard/MotivationalBanner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";

interface SidebarNavProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarNav({ onNavigate, collapsed, onToggleCollapse }: SidebarNavProps) {
  const { isAdmin } = useAuth();
  const items = isAdmin
    ? [...NAV_ITEMS, { label: "Usuários", path: "/admin/usuarios", icon: Users }]
    : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col bg-[#111827]">
      <div className={cn("flex items-center gap-2 px-5 py-6", collapsed && "justify-center px-2")}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF] text-white shadow-lg shadow-[#5B5FFB]/30">
          <BrainCircuit className="size-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-lg font-semibold text-white">Repositório Estudos</span>
            <span className="text-xs text-slate-400">O registro da sua trajetória até a aprovação</span>
          </div>
        )}
      </div>

      {onToggleCollapse && (
        <div className={cn("px-3 pb-2", collapsed && "flex justify-center px-0")}>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const link = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-gradient-to-r from-[#5B5FFB] to-[#7B61FF] text-white shadow-md shadow-[#5B5FFB]/25"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <item.icon className="size-4.5 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          );

          if (!collapsed) return link;

          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3">
          <MotivationalBanner />
        </div>
      )}
    </div>
  );
}
