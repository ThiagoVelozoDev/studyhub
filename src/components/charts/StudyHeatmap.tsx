import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

interface StudyHeatmapProps {
  data: { date: number; minutos: number }[];
}

function intensityClass(minutos: number): string {
  if (minutos <= 0) return "bg-muted";
  if (minutos < 30) return "bg-primary/25";
  if (minutos < 60) return "bg-primary/50";
  if (minutos < 120) return "bg-primary/75";
  return "bg-primary";
}

export function StudyHeatmap({ data }: StudyHeatmapProps) {
  const weeks: { date: number; minutos: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((day) => (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div className={cn("size-3.5 rounded-sm", intensityClass(day.minutos))} />
              </TooltipTrigger>
              <TooltipContent>
                {new Date(day.date).toLocaleDateString("pt-BR")} · {day.minutos}min
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
}
