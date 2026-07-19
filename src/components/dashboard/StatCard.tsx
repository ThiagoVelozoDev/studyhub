import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Sparkline } from "./Sparkline";

type StatCardVariant = "purple" | "green" | "orange" | "blue";

const VARIANT_GRADIENTS: Record<StatCardVariant, string> = {
  purple: "from-[#5B5FFB] to-[#7B61FF]",
  green: "from-[#22C55E] to-[#16A34A]",
  orange: "from-[#F59E0B] to-[#EA580C]",
  blue: "from-[#3B82F6] to-[#2563EB]",
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  secondary?: string;
  variant: StatCardVariant;
  sparklineValues?: number[];
  delay?: number;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  secondary,
  variant,
  sparklineValues,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, delay }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg shadow-black/5 ${VARIANT_GRADIENTS[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="size-5.5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-white/85">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {secondary && <p className="mt-0.5 text-xs text-white/75">{secondary}</p>}
      {sparklineValues && (
        <Sparkline values={sparklineValues} className="mt-2 h-6 w-full text-white/70" />
      )}
    </motion.div>
  );
}
