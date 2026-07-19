import { PieChart, Pie, Cell } from "recharts";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { StudyHeatmap } from "@/components/charts/StudyHeatmap";
import { useStatistics } from "@/hooks/useStatistics";

const SUBJECT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

export function DistributionStep({ activePlanId }: { activePlanId: string | undefined }) {
  const stats = useStatistics(activePlanId);

  const subjectConfig: ChartConfig = Object.fromEntries(
    stats.hoursBySubject.map((s, i) => [
      s.disciplinaId,
      { label: s.nome, color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] },
    ])
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horas por disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.hoursBySubject.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma sessão registrada ainda.
            </p>
          ) : (
            <ChartContainer config={subjectConfig} className="mx-auto aspect-square h-72">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="disciplinaId" />} />
                <Pie
                  data={stats.hoursBySubject}
                  dataKey="minutos"
                  nameKey="disciplinaId"
                  innerRadius={60}
                  outerRadius={100}
                  strokeWidth={2}
                >
                  {stats.hoursBySubject.map((entry, index) => (
                    <Cell key={entry.disciplinaId} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {stats.hoursBySubject.map((s, index) => (
              <span key={s.disciplinaId} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }}
                />
                {s.nome}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4" />
            Calendário de calor (últimas 17 semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StudyHeatmap data={stats.heatmap} />
        </CardContent>
      </Card>
    </div>
  );
}
