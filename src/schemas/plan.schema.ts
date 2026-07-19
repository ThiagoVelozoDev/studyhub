import { z } from "zod";

export const planSchema = z.object({
  editalId: z.string().min(1, "Selecione um edital"),
  nome: z.string().min(1, "Informe o nome do plano"),
  descricao: z.string().optional(),
  dataProva: z.string().optional(),
  metaDiaria: z.number().min(0),
  metaSemanal: z.number().min(0),
  metaMensal: z.number().min(0),
});

export type PlanFormValues = z.infer<typeof planSchema>;

export const planTopicUpdateSchema = z.object({
  concluido: z.boolean().optional(),
  percentualConclusao: z.number().min(0).max(100).optional(),
  observacoes: z.string().optional(),
});

export type PlanTopicUpdateValues = z.infer<typeof planTopicUpdateSchema>;
