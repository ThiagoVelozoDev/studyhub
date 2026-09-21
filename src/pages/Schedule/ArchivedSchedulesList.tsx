import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DIAS_SEMANA } from "@/constants/diasSemana";
import { formatHoursMinutes } from "@/utils/datetime";
import type { Schedule } from "@/types";

interface ArchivedSchedulesListProps {
  schedules: Schedule[];
  onRestore: (scheduleId: string) => void;
  restoringId?: string;
}

export function ArchivedSchedulesList({ schedules, onRestore, restoringId }: ArchivedSchedulesListProps) {
  if (schedules.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Cronogramas anteriores</p>
      <div className="space-y-2">
        {schedules.map((schedule) => {
          const dias = DIAS_SEMANA.filter((d) => schedule.diasEstudo.includes(d.value))
            .map((d) => d.label)
            .join(", ");
          return (
            <Card key={schedule.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {format(schedule.createdAt, "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatHoursMinutes(schedule.minutosPorDia * 60000)}/dia · {schedule.questoesPorDia}{" "}
                    questões/dia · {schedule.materiasPorDia} matérias/dia · {dias}
                    {schedule.numeroSemanas > 1 && <> · {schedule.numeroSemanas} semanas em rodízio</>}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onRestore(schedule.id)}
                  disabled={restoringId === schedule.id}
                >
                  Restaurar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
