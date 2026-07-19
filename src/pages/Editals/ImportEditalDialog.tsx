import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCopy, HelpCircle, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EditalForm } from "@/components/forms/EditalForm";
import { useCreateEditalWithContent } from "@/hooks/useEditals";
import {
  importEditalSchema,
  normalizeImportDisciplinas,
  type ImportDisciplinaNormalized,
} from "@/schemas/edital.schema";
import type { EditalFormValues } from "@/schemas/edital.schema";

const IMPORT_PROMPT = `Analise o edital em anexo (concurso público) e extraia todas as disciplinas e
respectivos tópicos do conteúdo programático. Responda APENAS com um JSON
válido, sem nenhum texto antes ou depois, no seguinte formato exato:

{
  "edital": { "nome": "...", "orgao": "...", "cargo": "...", "banca": "..." },
  "disciplinas": [
    { "nome": "...", "topicos": ["...", "..."] }
  ]
}

Mantenha a ordem em que os tópicos aparecem no edital original.`;

const EXAMPLE_JSON = `{
  "edital": {
    "nome": "TRF-1 2026",
    "orgao": "TRF 1ª Região",
    "cargo": "Técnico Judiciário",
    "banca": "FGV"
  },
  "disciplinas": [
    {
      "nome": "Direito Constitucional",
      "topicos": [
        "Controle de Constitucionalidade",
        { "nome": "Direitos Fundamentais", "cargaHorariaSugerida": 4 }
      ]
    }
  ]
}`;

interface ImportEditalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportEditalDialog({ open, onOpenChange }: ImportEditalDialogProps) {
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [rawJson, setRawJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [editalDefaults, setEditalDefaults] = useState<Partial<EditalFormValues> | undefined>(undefined);
  const [disciplinas, setDisciplinas] = useState<ImportDisciplinaNormalized[]>([]);

  const createEditalWithContent = useCreateEditalWithContent();

  function resetAndClose() {
    setStep("paste");
    setRawJson("");
    setParseError(null);
    setEditalDefaults(undefined);
    setDisciplinas([]);
    onOpenChange(false);
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(IMPORT_PROMPT);
    toast.success("Prompt copiado");
  }

  function handleAnalyze() {
    setParseError(null);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      setParseError("JSON inválido: verifique a sintaxe do texto colado.");
      return;
    }

    const result = importEditalSchema.safeParse(parsedJson);
    if (!result.success) {
      setParseError(result.error.issues.map((issue) => issue.message).join(" · "));
      return;
    }

    setEditalDefaults({
      nome: result.data.edital?.nome ?? "",
      orgao: result.data.edital?.orgao ?? "",
      cargo: result.data.edital?.cargo ?? "",
      banca: result.data.edital?.banca ?? "",
      categoria: result.data.edital?.categoria ?? "",
      status: "ativo",
    });
    setDisciplinas(normalizeImportDisciplinas(result.data.disciplinas));
    setStep("review");
  }

  function handleRemoveDisciplina(index: number) {
    setDisciplinas((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirmCreate(values: EditalFormValues) {
    if (disciplinas.length === 0) {
      toast.error("Inclua ao menos uma disciplina antes de criar o edital");
      return;
    }
    try {
      await createEditalWithContent.mutateAsync({
        editalInput: {
          nome: values.nome,
          orgao: values.orgao,
          cargo: values.cargo,
          banca: values.banca,
          categoria: values.categoria,
          public: values.public,
          descricao: values.descricao,
          linkEdital: values.linkEdital,
          status: values.status,
          dataPublicacao: values.dataPublicacao ? new Date(values.dataPublicacao).getTime() : undefined,
        },
        disciplinas,
      });
      toast.success("Edital importado com sucesso");
      resetAndClose();
    } catch {
      toast.error("Não foi possível importar o edital");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : resetAndClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar edital via JSON</DialogTitle>
        </DialogHeader>

        {step === "paste" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Cole abaixo o JSON com as disciplinas e tópicos do edital.
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0">
                    <HelpCircle className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 space-y-3">
                  <div>
                    <p className="mb-1 text-sm font-medium">Como gerar o JSON</p>
                    <p className="text-xs text-muted-foreground">
                      Envie o PDF do edital para uma IA de sua preferência (Claude, ChatGPT etc.)
                      junto com o prompt abaixo, e cole a resposta no campo ao lado.
                    </p>
                  </div>
                  <pre className="max-h-40 overflow-y-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap">
                    {IMPORT_PROMPT}
                  </pre>
                  <Button size="sm" variant="outline" className="w-full" onClick={handleCopyPrompt}>
                    <ClipboardCopy className="size-3.5" />
                    Copiar prompt
                  </Button>
                  <div>
                    <p className="mb-1 text-sm font-medium">Formato esperado</p>
                    <pre className="max-h-40 overflow-y-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap">
                      {EXAMPLE_JSON}
                    </pre>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Textarea
              rows={10}
              placeholder="Cole aqui o JSON gerado pela IA..."
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="font-mono text-xs"
            />
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
            <Button className="w-full" onClick={handleAnalyze} disabled={!rawJson.trim()}>
              Analisar
            </Button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setStep("paste")}>
              <ArrowLeft className="size-4" />
              Voltar
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {disciplinas.length} disciplina{disciplinas.length === 1 ? "" : "s"} encontrada
                {disciplinas.length === 1 ? "" : "s"}
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {disciplinas.map((disciplina, index) => (
                  <div
                    key={`${disciplina.nome}-${index}`}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                  >
                    <span className="truncate">
                      {disciplina.nome} — {disciplina.topicos.length} tópico
                      {disciplina.topicos.length === 1 ? "" : "s"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveDisciplina(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Confirme ou complete os dados do edital abaixo. Você poderá editar tópicos
              individualmente depois de criado.
            </p>
            <EditalForm
              defaultValues={editalDefaults}
              onSubmit={handleConfirmCreate}
              submitting={createEditalWithContent.isPending}
              submitLabel="Criar edital com este conteúdo"
            />
            {createEditalWithContent.isPending && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Criando disciplinas e tópicos...
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
