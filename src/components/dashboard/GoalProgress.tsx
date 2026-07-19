import { Progress } from "@/components/ui/progress";
import { formatHoursMinutes } from "@/utils/datetime";

interface GoalProgressProps {
  label: string;
  current: number;
  goal: number;
}

export function GoalProgress({ label, current, goal }: GoalProgressProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {formatHoursMinutes(current)} / {goal > 0 ? formatHoursMinutes(goal) : "—"}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
