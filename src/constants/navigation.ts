import type { LucideIcon } from "lucide-react";
import {
  Timer,
  ClipboardList,
  FileText,
  History,
  Settings,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Minha Evolução", path: "/dashboard", icon: TrendingUp },
  { label: "Estudar", path: "/study", icon: Timer },
  { label: "Planos de Estudos", path: "/plans", icon: ClipboardList },
  { label: "Cronograma", path: "/schedule", icon: CalendarDays },
  { label: "Editais", path: "/editals", icon: FileText },
  { label: "Histórico", path: "/history", icon: History },
  { label: "Configurações", path: "/settings", icon: Settings },
];
