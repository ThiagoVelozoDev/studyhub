import { useMemo } from "react";
import { useStudySessions } from "./useStudySessions";
import { computeStreak } from "@/utils/datetime";

/** Sequência de dias estudados, considerando todas as sessões do usuário (qualquer plano). */
export function useStreak() {
  const { data: sessions, isLoading } = useStudySessions();
  const streak = useMemo(() => computeStreak((sessions ?? []).map((s) => s.inicio)), [sessions]);
  return { streak, isLoading };
}
