import { z } from "zod";

export const planTopicSchema = z.object({
  nome: z.string().min(1, "Informe o nome do tópico"),
});

export type PlanTopicFormValues = z.infer<typeof planTopicSchema>;
