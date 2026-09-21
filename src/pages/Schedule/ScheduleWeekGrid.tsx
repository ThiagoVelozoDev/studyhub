import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DIAS_SEMANA } from "@/constants/diasSemana";
import { cn } from "@/utils/cn";
import type { PlanSubject, ScheduleItem } from "@/types";

const FULL_LABELS: Record<string, string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};

interface ScheduleWeekGridProps {
  items: ScheduleItem[];
  subjectsById: Map<string, PlanSubject>;
  onToggleItem: (item: ScheduleItem, concluido: boolean) => void;
  currentWeek: number;
  totalWeeks: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function ScheduleWeekGrid({
  items,
  subjectsById,
  onToggleItem,
  currentWeek,
  totalWeeks,
  onPrevWeek,
  onNextWeek,
}: ScheduleWeekGridProps) {
  return (
    <div className="space-y-3">
      {totalWeeks > 1 && (
        <div className="flex items-center justify-between gap-2 print:justify-start">
          <Button variant="outline" size="sm" onClick={onPrevWeek} className="print:hidden">
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <p className="text-sm font-medium">
            Semana {currentWeek} de {totalWeeks}
          </p>
          <Button variant="outline" size="sm" onClick={onNextWeek} className="print:hidden">
            Próxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 print:grid-cols-7 print:gap-2">
        {DIAS_SEMANA.map((dia) => {
          const diaItems = items
            .filter((item) => item.diaSemana === dia.value)
            .sort((a, b) => a.ordem - b.ordem);
          return (
            <Card key={dia.value} className="min-w-0 gap-3 py-4 print:py-3">
              <CardHeader className="px-4 print:px-3">
                <CardTitle className="text-sm">{FULL_LABELS[dia.value]}</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 space-y-2 px-4 print:px-3">
                {diaItems.length === 0 && <p className="text-xs text-muted-foreground">Dia livre</p>}
                {diaItems.map((item) => {
                  const subject = subjectsById.get(item.disciplinaId);
                  return (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-sm print:[print-color-adjust:exact]"
                    >
                      <Checkbox
                        checked={item.concluido}
                        onCheckedChange={(checked) => onToggleItem(item, checked === true)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="size-2.5 shrink-0 rounded-full print:[print-color-adjust:exact]"
                            style={{ backgroundColor: subject?.cor }}
                          />
                          <span
                            className={cn(
                              "min-w-0 break-words font-medium",
                              item.concluido && "text-muted-foreground line-through"
                            )}
                          >
                            {subject?.nome ?? "Disciplina"}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.minutosPlanejados}min · {item.questoesPlanejadas} questões
                        </span>
                      </span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
