import { DIAS_SEMANA } from "@/constants/diasSemana";
import type { PlanSubject, ScheduleItem } from "@/types";

export function computeScheduleCapacity(diasCount: number, materiasPorDia: number): number {
  return diasCount * materiasPorDia;
}

export function computeNumeroSemanas(totalDisciplinas: number, capacidadeSemanal: number): number {
  if (capacidadeSemanal <= 0) return 1;
  return Math.max(1, Math.ceil(totalDisciplinas / capacidadeSemanal));
}

export interface GenerateScheduleItemsInput {
  subjects: PlanSubject[];
  diasSelecionados: string[];
  minutosPorDia: number;
  questoesPorDia: number;
  materiasPorDia: number;
}

export type GeneratedScheduleItem = Omit<
  ScheduleItem,
  "id" | "userId" | "cronogramaId" | "concluido"
>;

/**
 * Distribui as disciplinas do plano pelos dias selecionados em blocos de
 * `materiasPorDia` (um teto fixo por dia, não uma média). Quando não cabem
 * todas em uma semana, o excedente vira semanas seguintes (`semana`
 * incrementa) — a UI as apresenta como um rodízio que repete a partir da
 * última. `subjects` já deve vir ordenado/cortado pela prioridade e pelo
 * modo ("todas" ou "focar") escolhidos antes de chamar esta função.
 */
export function generateScheduleItems({
  subjects,
  diasSelecionados,
  minutosPorDia,
  questoesPorDia,
  materiasPorDia,
}: GenerateScheduleItemsInput): GeneratedScheduleItem[] {
  const diasOrdenados = DIAS_SEMANA.map((d) => d.value).filter((v) => diasSelecionados.includes(v));
  if (subjects.length === 0 || diasOrdenados.length === 0 || materiasPorDia <= 0) return [];

  const capacidadeSemanal = computeScheduleCapacity(diasOrdenados.length, materiasPorDia);
  const numeroSemanas = computeNumeroSemanas(subjects.length, capacidadeSemanal);

  const items: GeneratedScheduleItem[] = [];
  for (let semanaIdx = 0; semanaIdx < numeroSemanas; semanaIdx++) {
    const disciplinasDaSemana = subjects.slice(
      semanaIdx * capacidadeSemanal,
      (semanaIdx + 1) * capacidadeSemanal
    );
    for (let diaIdx = 0; diaIdx < diasOrdenados.length; diaIdx++) {
      const disciplinasDoDia = disciplinasDaSemana.slice(
        diaIdx * materiasPorDia,
        (diaIdx + 1) * materiasPorDia
      );
      if (disciplinasDoDia.length === 0) continue;

      const minutosPorDisciplina = Math.round(minutosPorDia / disciplinasDoDia.length);
      const questoesPorDisciplina = Math.round(questoesPorDia / disciplinasDoDia.length);
      disciplinasDoDia.forEach((subject, ordem) => {
        items.push({
          semana: semanaIdx + 1,
          diaSemana: diasOrdenados[diaIdx],
          disciplinaId: subject.id,
          ordem,
          minutosPlanejados: minutosPorDisciplina,
          questoesPlanejadas: questoesPorDisciplina,
        });
      });
    }
  }
  return items;
}
