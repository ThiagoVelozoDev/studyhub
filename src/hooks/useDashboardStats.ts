import { useMemo } from "react";
import { useStudySessions } from "./useStudySessions";
import { usePlans, usePlanSubjects } from "./usePlans";
import { useGoals } from "./useGoals";
import { startOfDay, startOfMonth, startOfWeek, computeStreak } from "@/utils/datetime";
import type { StudySession } from "@/types";

export interface SubjectRanking {
  disciplinaId: string;
  nome: string;
  cor: string;
  totalMs: number;
}

export function useDashboardStats(planId?: string) {
  const { data: sessions, isLoading: loadingSessions } = useStudySessions({ planoId: planId });
  const { data: plans } = usePlans();
  const { data: subjects } = usePlanSubjects(planId ?? plans?.[0]?.id);
  const { data: goals } = useGoals();

  const stats = useMemo(() => {
    const all = sessions ?? [];
    const now = Date.now();
    const todayStart = startOfDay(new Date(now));
    const weekStart = startOfWeek(new Date(now));
    const monthStart = startOfMonth(new Date(now));

    const sum = (list: StudySession[]) => list.reduce((acc, s) => acc + s.duracao, 0);

    const today = sum(all.filter((s) => s.inicio >= todayStart));
    const week = sum(all.filter((s) => s.inicio >= weekStart));
    const month = sum(all.filter((s) => s.inicio >= monthStart));
    const total = sum(all);

    const bySubject = new Map<string, number>();
    for (const s of all) {
      bySubject.set(s.disciplinaId, (bySubject.get(s.disciplinaId) ?? 0) + s.duracao);
    }
    const ranking: SubjectRanking[] = Array.from(bySubject.entries())
      .map(([disciplinaId, totalMs]) => {
        const subject = subjects?.find((s) => s.id === disciplinaId);
        return {
          disciplinaId,
          nome: subject?.nome ?? "Disciplina",
          cor: subject?.cor ?? "#6366f1",
          totalMs,
        };
      })
      .sort((a, b) => b.totalMs - a.totalMs);

    const streak = computeStreak(
      all.map((s) => s.inicio),
      now
    );

    const last7Days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayStart - i * 86_400_000;
      const dayEnd = dayStart + 86_400_000;
      const minutes = sum(all.filter((s) => s.inicio >= dayStart && s.inicio < dayEnd)) / 60_000;
      last7Days.push(Math.round(minutes));
    }

    const sessionsTotal = all.length;
    const sessionsWeek = all.filter((s) => s.inicio >= weekStart).length;

    const recentActivities = [...all].sort((a, b) => b.inicio - a.inicio).slice(0, 8);

    const diariaGoal = goals?.find((g) => g.periodo === "diaria");
    const semanalGoal = goals?.find((g) => g.periodo === "semanal");
    const mensalGoal = goals?.find((g) => g.periodo === "mensal");

    return {
      today,
      week,
      month,
      total,
      ranking,
      streak,
      last7Days,
      sessionsTotal,
      sessionsWeek,
      recentActivities,
      metaDiariaMs: (diariaGoal?.metaMinutos ?? plans?.[0]?.metaDiaria ?? 0) * 60_000,
      metaSemanalMs: (semanalGoal?.metaMinutos ?? plans?.[0]?.metaSemanal ?? 0) * 60_000,
      metaMensalMs: (mensalGoal?.metaMinutos ?? plans?.[0]?.metaMensal ?? 0) * 60_000,
    };
  }, [sessions, subjects, goals, plans]);

  return { ...stats, isLoading: loadingSessions };
}
