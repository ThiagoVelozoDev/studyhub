import { NavLink } from "react-router-dom";
import { GraduationCap, Users } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navigation";
import { MotivationalBanner } from "@/components/dashboard/MotivationalBanner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const items = isAdmin
    ? [...NAV_ITEMS, { label: "Usuários", path: "/admin/usuarios", icon: Users }]
    : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col bg-[#111827]">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF] text-white shadow-lg shadow-[#5B5FFB]/30">
          <GraduationCap className="size-5" />
        </div>
        <span className="text-lg font-semibold text-white">StudyHub</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-[#5B5FFB] to-[#7B61FF] text-white shadow-md shadow-[#5B5FFB]/25"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <MotivationalBanner />
      </div>
    </div>
  );
}
