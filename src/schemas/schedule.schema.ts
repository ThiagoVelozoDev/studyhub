import { z } from "zod";

export const scheduleConfigSchema = z.object({
  minutosPorDia: z.number().min(1, "Informe quantas horas por dia"),
  questoesPorDia: z.number().min(0, "Informe quantas questões por dia"),
  diasEstudo: z.array(z.string()).min(1, "Selecione ao menos um dia"),
  materiasPorDia: z.number().min(1, "Informe quantas matérias por dia"),
  modo: z.enum(["todas", "focar"]),
  prioridade: z.enum(["ordem", "intercalado", "basicas", "especificas"]),
});

export type ScheduleConfigFormValues = z.infer<typeof scheduleConfigSchema>;
