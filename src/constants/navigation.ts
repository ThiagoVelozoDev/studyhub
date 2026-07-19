import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Timer,
  ClipboardList,
  FileText,
  BarChart3,
  History,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Estudar", path: "/study", icon: Timer },
  { label: "Planos", path: "/plans", icon: ClipboardList },
  { label: "Editais", path: "/editals", icon: FileText },
  { label: "Estatísticas", path: "/statistics", icon: BarChart3 },
  { label: "Histórico", path: "/history", icon: History },
  { label: "Configurações", path: "/settings", icon: Settings },
];
