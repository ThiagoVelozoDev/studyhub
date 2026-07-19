export interface DiaSemana {
  value: string;
  label: string;
}

export const DIAS_SEMANA: DiaSemana[] = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

export const DIAS_ESTUDO_PADRAO = ["seg", "ter", "qua", "qui", "sex"];
