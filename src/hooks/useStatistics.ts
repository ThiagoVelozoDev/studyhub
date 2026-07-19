import { useMemo } from "react";
import { useStudySessions } from "./useStudySessions";
import { usePlanSubjects } from "./usePlans";
import { startOfDay, startOfWeek, startOfMonth } from "@/utils/datetime";
import type { StudySession } from "@/types";

export interface DayPoint {
  date: number;
  label: string;
  minutos: number;
}

export interface SubjectPoint {
  disciplinaId: string;
  nome: string;
  cor: string;
  minutos: number;
  acertos: number;
  questoes: number;
  percentualAcerto: number;
}

function formatDayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatWeekLabel(ts: number): string {
  return `Sem ${new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

function formatMonthLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function useStatistics(planId?: string) {
  const { data: sessions, isLoading } = useStudySessions({ planoId: planId });
  const { data: subjects } = usePlanSubjects(planId);

  const stats = useMemo(() => {
    const all: StudySession[] = sessions ?? [];
    const now = Date.now();

    const byDayMap = new Map<number, number>();
    for (let i = 29; i >= 0; i--) {
      byDayMap.set(startOfDay(new Date(now - i * 86_400_000)), 0);
    }
    for (const s of all) {
      const key = startOfDay(new Date(s.inicio));
      if (byDayMap.has(key)) byDayMap.set(key, (byDayMap.get(key) ?? 0) + s.duracao);
    }
    const hoursByDay: DayPoint[] = Array.from(byDayMap.entries()).map(([date, ms]) => ({
      date,
      label: formatDayLabel(date),
      minutos: Math.round(ms / 60000),
    }));

    const byWeekMap = new Map<number, number>();
    for (let i = 11; i >= 0; i--) {
      byWeekMap.set(startOfWeek(new Date(now - i * 7 * 86_400_000)), 0);
    }
    for (const s of all) {
      const key = startOfWeek(new Date(s.inicio));
      if (byWeekMap.has(key)) byWeekMap.set(key, (byWeekMap.get(key) ?? 0) + s.duracao);
    }
    const hoursByWeek: DayPoint[] = Array.from(byWeekMap.entries()).map(([date, ms]) => ({
      date,
      label: formatWeekLabel(date),
      minutos: Math.round(ms / 60000),
    }));

    const byMonthMap = new Map<number, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      byMonthMap.set(startOfMonth(d), 0);
    }
    for (const s of all) {
      const key = startOfMonth(new Date(s.inicio));
      if (byMonthMap.has(key)) byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + s.duracao);
    }
    const hoursByMonth: DayPoint[] = Array.from(byMonthMap.entries()).map(([date, ms]) => ({
      date,
      label: formatMonthLabel(date),
      minutos: Math.round(ms / 60000),
    }));

    let cumulative = 0;
    const evolution = hoursByDay.map((point) => {
      cumulative += point.minutos;
      return { ...point, acumuladoMinutos: cumulative };
    });

    const bySubjectMap = new Map<string, { minutos: number; acertos: number; questoes: number }>();
    for (const s of all) {
      const entry = bySubjectMap.get(s.disciplinaId) ?? { minutos: 0, acertos: 0, questoes: 0 };
      entry.minutos += s.duracao / 60000;
      entry.questoes += (s.questoesCertas ?? 0) + (s.questoesErradas ?? 0);
      entry.acertos += s.questoesCertas ?? 0;
      bySubjectMap.set(s.disciplinaId, entry);
    }
    const hoursBySubject: SubjectPoint[] = Array.from(bySubjectMap.entries()).map(
      ([disciplinaId, entry]) => {
        const subject = subjects?.find((s) => s.id === disciplinaId);
        return {
          disciplinaId,
          nome: subject?.nome ?? "Disciplina",
          cor: subject?.cor ?? "#2a78d6",
          minutos: Math.round(entry.minutos),
          acertos: entry.acertos,
          questoes: entry.questoes,
          percentualAcerto: entry.questoes > 0 ? Math.round((entry.acertos / entry.questoes) * 100) : 0,
        };
      }
    ).sort((a, b) => b.minutos - a.minutos);

    const heatmapDays = 119;
    const heatmap: { date: number; minutos: number }[] = [];
    const heatmapMap = new Map<number, number>();
    for (let i = heatmapDays - 1; i >= 0; i--) {
      heatmapMap.set(startOfDay(new Date(now - i * 86_400_000)), 0);
    }
    for (const s of all) {
      const key = startOfDay(new Date(s.inicio));
      if (heatmapMap.has(key)) heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + s.duracao);
    }
    for (const [date, ms] of heatmapMap.entries()) {
      heatmap.push({ date, minutos: Math.round(ms / 60000) });
    }
    heatmap.sort((a, b) => a.date - b.date);

    return { hoursByDay, hoursByWeek, hoursByMonth, evolution, hoursBySubject, heatmap };
  }, [sessions, subjects]);

  return { ...stats, isLoading };
}
