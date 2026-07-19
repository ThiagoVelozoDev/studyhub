import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useStatistics } from "@/hooks/useStatistics";

type Granularity = "dia" | "semana" | "mes";

const TIME_CHART_CONFIG: ChartConfig = {
  minutos: { label: "Minutos estudados", color: "var(--chart-1)" },
};

const CUMULATIVE_CHART_CONFIG: ChartConfig = {
  acumuladoMinutos: { label: "Tempo acumulado (min)", color: "var(--chart-5)" },
};

export function TrendsStep({ activePlanId }: { activePlanId: string | undefined }) {
  const [granularity, setGranularity] = useState<Granularity>("dia");
  const stats = useStatistics(activePlanId);

  const timeSeries =
    granularity === "dia" ? stats.hoursByDay : granularity === "semana" ? stats.hoursByWeek : stats.hoursByMonth;

  return (
    <div className="space-y-6">
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
    </div>
  );
}
