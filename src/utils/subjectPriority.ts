import { BASIC_SUBJECT_KEYWORDS } from "@/constants/basicSubjectKeywords";
import type { PlanSubject } from "@/types";

export type SchedulePriority = "ordem" | "intercalado" | "basicas" | "especificas";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function isBasicSubject(nome: string): boolean {
  const normalized = normalize(nome);
  return BASIC_SUBJECT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Reordena as disciplinas conforme a prioridade escolhida no cronograma.
 * "ordem" preserva a ordem recebida (a `ordem` do plano); as demais separam
 * básicas (heurístico de palavra-chave) de específicas.
 */
export function sortSubjectsByPriority(
  subjects: PlanSubject[],
  priority: SchedulePriority
): PlanSubject[] {
  if (priority === "ordem") return subjects;

  const basicas = subjects.filter((s) => isBasicSubject(s.nome));
  const especificas = subjects.filter((s) => !isBasicSubject(s.nome));

  if (priority === "basicas") return [...basicas, ...especificas];
  if (priority === "especificas") return [...especificas, ...basicas];

  const intercalado: PlanSubject[] = [];
  const max = Math.max(basicas.length, especificas.length);
  for (let i = 0; i < max; i++) {
    if (i < basicas.length) intercalado.push(basicas[i]);
    if (i < especificas.length) intercalado.push(especificas[i]);
  }
  return intercalado;
}
