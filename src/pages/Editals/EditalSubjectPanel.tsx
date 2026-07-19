import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditalTopicForm } from "@/components/forms/EditalTopicForm";
import {
  useCreateEditalTopic,
  useDeleteEditalTopic,
  useEditalTopics,
  useUpdateEditalTopic,
} from "@/hooks/useEditals";
import { cn } from "@/utils/cn";
import type { EditalSubject, EditalTopic } from "@/types";
import type { EditalTopicFormValues } from "@/schemas/edital.schema";

export function EditalSubjectPanel({
  subject,
  onEdit,
  onDelete,
}: {
  subject: EditalSubject;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: topics, isLoading } = useEditalTopics(expanded ? subject.id : undefined);
  const createTopic = useCreateEditalTopic(subject.id);
  const updateTopic = useUpdateEditalTopic(subject.id);
  const deleteTopic = useDeleteEditalTopic(subject.id);

  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<EditalTopic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function handleSubmitTopic(values: EditalTopicFormValues) {
    try {
      if (editingTopic) {
        await updateTopic.mutateAsync({ topicId: editingTopic.id, input: values });
        toast.success("Tópico atualizado");
      } else {
        await createTopic.mutateAsync({
          editalId: subject.editalId,
          disciplinaId: subject.id,
          nome: values.nome,
          descricao: values.descricao,
          cargaHorariaSugerida: values.cargaHorariaSugerida,
          ordem: topics?.length ?? 0,
        });
        toast.success("Tópico criado");
      }
      setTopicDialogOpen(false);
      setEditingTopic(null);
    } catch {
      toast.error("Não foi possível salvar o tópico");
    }
  }

  async function confirmDeleteTopic() {
    if (!deleteTarget) return;
    try {
      await deleteTopic.mutateAsync(deleteTarget);
      toast.success("Tópico excluído");
    } catch {
      toast.error("Não foi possível excluir o tópico");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="rounded-xl border border-border/60">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: subject.cor }} />
        <span className="flex-1 font-medium">{subject.nome}</span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border/60 px-4 py-3">
          {isLoading && <Skeleton className="h-10 w-full" />}
          {!isLoading && topics?.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Nenhum tópico cadastrado ainda.</p>
          )}
          {!isLoading &&
            topics?.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{topic.nome}</p>
                  {!!topic.cargaHorariaSugerida && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {topic.cargaHorariaSugerida}h sugeridas
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => {
                      setEditingTopic(topic);
                      setTopicDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(topic.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setEditingTopic(null);
              setTopicDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo tópico
          </Button>
        </div>
      )}

      <Dialog
        open={topicDialogOpen}
        onOpenChange={(open) => {
          setTopicDialogOpen(open);
          if (!open) setEditingTopic(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Editar tópico" : "Novo tópico"}</DialogTitle>
          </DialogHeader>
          <EditalTopicForm
            defaultValues={editingTopic ?? undefined}
            onSubmit={handleSubmitTopic}
            submitting={createTopic.isPending || updateTopic.isPending}
            submitLabel={editingTopic ? "Salvar alterações" : "Criar tópico"}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tópico</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTopic}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
