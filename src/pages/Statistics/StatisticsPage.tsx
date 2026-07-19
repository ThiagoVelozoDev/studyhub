import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/common/EmptyState";
import { StudyHeatmap } from "@/components/charts/StudyHeatmap";
import { usePlans } from "@/hooks/usePlans";
import { useStatistics } from "@/hooks/useStatistics";

type Granularity = "dia" | "semana" | "mes";

const TIME_CHART_CONFIG: ChartConfig = {
  minutos: { label: "Minutos estudados", color: "var(--chart-1)" },
};

const CUMULATIVE_CHART_CONFIG: ChartConfig = {
  acumuladoMinutos: { label: "Tempo acumulado (min)", color: "var(--chart-5)" },
};

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

export default function StatisticsPage() {
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const [planId, setPlanId] = useState<string | undefined>(undefined);
  const activePlanId = planId ?? plans?.[0]?.id;
  const [granularity, setGranularity] = useState<Granularity>("dia");

  const stats = useStatistics(activePlanId);

  if (!loadingPlans && plans?.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sem dados para exibir"
        description="Crie um plano e registre sessões de estudo para ver suas estatísticas."
      />
    );
  }

  const timeSeries =
    granularity === "dia" ? stats.hoursByDay : granularity === "semana" ? stats.hoursByWeek : stats.hoursByMonth;

  const subjectConfig: ChartConfig = Object.fromEntries(
    stats.hoursBySubject.map((s, i) => [
      s.disciplinaId,
      { label: s.nome, color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] },
    ])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Estatísticas</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada do seu progresso</p>
        </div>
        {plans && plans.length > 1 && (
          <Select value={activePlanId} onValueChange={setPlanId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {stats.isLoading ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Horas de estudo</CardTitle>
            <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <TabsList>
                <TabsTrigger value="dia">Dia</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ChartContainer config={TIME_CHART_CONFIG} className="aspect-auto h-72 w-full">
              <BarChart data={timeSeries}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutos" fill="var(--color-minutos)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
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
                      <Cell
                        key={entry.disciplinaId}
                        fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]}
                      />
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
            <CardTitle className="text-base">Desempenho por disciplina (% de acerto)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.hoursBySubject.filter((s) => s.questoes > 0).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Registre questões resolvidas para ver o desempenho.
              </p>
            ) : (
              <ChartContainer config={subjectConfig} className="aspect-auto h-72 w-full">
                <BarChart
                  data={stats.hoursBySubject.filter((s) => s.questoes > 0)}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="nome" tickLine={false} axisLine={false} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="percentualAcerto" radius={4}>
                    {stats.hoursBySubject
                      .filter((s) => s.questoes > 0)
                      .map((entry, index) => (
                        <Cell key={entry.disciplinaId} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                      ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução e tempo acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CUMULATIVE_CHART_CONFIG} className="aspect-auto h-72 w-full">
            <AreaChart data={stats.evolution}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="acumuladoMinutos"
                type="monotone"
                fill="var(--color-acumuladoMinutos)"
                fillOpacity={0.2}
                stroke="var(--color-acumuladoMinutos)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4" />
            Calendário de calor (últimos 17 semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StudyHeatmap data={stats.heatmap} />
        </CardContent>
      </Card>
    </div>
  );
}
