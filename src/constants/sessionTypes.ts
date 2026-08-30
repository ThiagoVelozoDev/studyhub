import type { SessionType } from "@/types";

export interface SessionTypeOption {
  value: SessionType;
  label: string;
}

export const SESSION_TYPES: SessionTypeOption[] = [
  { value: "aula", label: "Estudar (vídeo aula)" },
  { value: "questoes", label: "Questões" },
  { value: "simulado", label: "Simulado" },
];

export function getSessionTypeLabel(value: SessionType | undefined): string {
  return SESSION_TYPES.find((t) => t.value === value)?.label ?? "Sessão de estudo";
}
