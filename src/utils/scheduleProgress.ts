import type { ScheduleItem } from "@/types";

/**
 * % (0-100) de ScheduleItem.concluido sobre o total do cronograma ativo.
 * Calculado sobre TODAS as semanas (não só a semana atual) para não "pular"
 * ao navegar entre semanas. 0 se não houver itens (evita NaN).
 */
export function computeScheduleProgress(items: ScheduleItem[] | undefined): number {
  if (!items || items.length === 0) return 0;
  return Math.round((items.filter((item) => item.concluido).length / items.length) * 100);
}
