import { z } from "zod";

export const editalSchema = z.object({
  nome: z.string().min(1, "Informe o nome do edital"),
  orgao: z.string().min(1, "Informe o órgão"),
  cargo: z.string().min(1, "Informe o cargo"),
  banca: z.string().min(1, "Informe a banca"),
  descricao: z.string().optional(),
  dataPublicacao: z.string().optional(),
  linkEdital: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
  status: z.enum(["ativo", "encerrado", "rascunho"]),
});

export type EditalFormValues = z.infer<typeof editalSchema>;

export const editalSubjectSchema = z.object({
  nome: z.string().min(1, "Informe o nome da disciplina"),
  cor: z.string().min(1),
  icone: z.string().min(1),
});

export type EditalSubjectFormValues = z.infer<typeof editalSubjectSchema>;

export const editalTopicSchema = z.object({
  nome: z.string().min(1, "Informe o nome do tópico"),
  descricao: z.string().optional(),
  cargaHorariaSugerida: z.number().min(0).optional(),
});

export type EditalTopicFormValues = z.infer<typeof editalTopicSchema>;

const importEditalTopicSchema = z.union([
  z.string().min(1),
  z.object({
    nome: z.string().min(1),
    descricao: z.string().optional(),
    cargaHorariaSugerida: z.number().min(0).optional(),
  }),
]);

export const importEditalSchema = z.object({
  edital: z
    .object({
      nome: z.string().min(1),
      orgao: z.string().min(1),
      cargo: z.string().min(1),
      banca: z.string().min(1),
    })
    .partial()
    .optional(),
  disciplinas: z
    .array(
      z.object({
        nome: z.string().min(1),
        topicos: z.array(importEditalTopicSchema).default([]),
      })
    )
    .min(1, "Inclua ao menos uma disciplina"),
});

export type ImportEditalValues = z.infer<typeof importEditalSchema>;

export interface ImportTopicNormalized {
  nome: string;
  descricao?: string;
  cargaHorariaSugerida?: number;
}

export interface ImportDisciplinaNormalized {
  nome: string;
  topicos: ImportTopicNormalized[];
}

export function normalizeImportDisciplinas(
  disciplinas: ImportEditalValues["disciplinas"]
): ImportDisciplinaNormalized[] {
  return disciplinas.map((disciplina) => ({
    nome: disciplina.nome,
    topicos: disciplina.topicos.map((topico) =>
      typeof topico === "string" ? { nome: topico } : topico
    ),
  }));
}
