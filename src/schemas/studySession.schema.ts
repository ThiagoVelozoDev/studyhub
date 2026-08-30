import { z } from "zod";

export const studySessionSchema = z
  .object({
    planoId: z.string().min(1, "Selecione um plano"),
    disciplinaId: z.string().min(1, "Selecione uma disciplina"),
    topicoId: z.string().optional(),
    data: z.string().min(1, "Informe a data"),
    horas: z.number().min(0),
    minutos: z.number().min(0).max(59),
    questoesCertas: z.number().min(0).optional(),
    questoesErradas: z.number().min(0).optional(),
    questoesBrancas: z.number().min(0).optional(),
    observacoes: z.string().optional(),
  })
  .refine((v) => v.horas > 0 || v.minutos > 0, {
    message: "Informe um tempo maior que zero",
    path: ["minutos"],
  });

export type StudySessionFormValues = z.infer<typeof studySessionSchema>;
