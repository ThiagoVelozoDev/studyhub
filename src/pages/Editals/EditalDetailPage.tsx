import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { EditalSubjectForm } from "@/components/forms/EditalSubjectForm";
import {
  useCreateEditalSubject,
  useDeleteEditalSubject,
  useEdital,
  useEditalSubjects,
  useUpdateEditalSubject,
} from "@/hooks/useEditals";
import { EditalSubjectPanel } from "./EditalSubjectPanel";
import type { EditalSubject } from "@/types";
import type { EditalSubjectFormValues } from "@/schemas/edital.schema";

export default function EditalDetailPage() {
  const { editalId } = useParams<{ editalId: string }>();
  const { data: edital, isLoading: loadingEdital } = useEdital(editalId);
  const { data: subjects, isLoading: loadingSubjects } = useEditalSubjects(editalId);

  const createSubject = useCreateEditalSubject(editalId ?? "");
  const updateSubject = useUpdateEditalSubject(editalId ?? "");
  const deleteSubject = useDeleteEditalSubject(editalId ?? "");

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<EditalSubject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function handleSubmitSubject(values: EditalSubjectFormValues) {
    if (!editalId) return;
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ subjectId: editingSubject.id, input: values });
        toast.success("Disciplina atualizada");
      } else {
        await createSubject.mutateAsync({
          editalId,
          nome: values.nome,
          cor: values.cor,
          icone: values.icone,
          ordem: subjects?.length ?? 0,
        });
        toast.success("Disciplina criada");
      }
      setSubjectDialogOpen(false);
      setEditingSubject(null);
    } catch {
      toast.error("Não foi possível salvar a disciplina");
    }
  }

  async function confirmDeleteSubject() {
    if (!deleteTarget) return;
    try {
      await deleteSubject.mutateAsync(deleteTarget);
      toast.success("Disciplina excluída");
    } catch {
      toast.error("Não foi possível excluir a disciplina");
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loadingEdital) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!edital) {
    return <EmptyState icon={BookOpen} title="Edital não encontrado" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/editals">
            <ArrowLeft className="size-4" />
            Voltar aos editais
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{edital.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {edital.orgao} · {edital.cargo} · Banca {edital.banca}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Disciplinas</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditingSubject(null);
            setSubjectDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova disciplina
        </Button>
      </div>

      {loadingSubjects && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loadingSubjects && subjects?.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma disciplina cadastrada"
          description="Adicione disciplinas para depois organizar os tópicos do edital."
          action={
            <Button onClick={() => setSubjectDialogOpen(true)}>
              <Plus className="size-4" />
              Adicionar disciplina
            </Button>
          }
        />
      )}

      {!loadingSubjects && subjects && subjects.length > 0 && (
        <div className="space-y-3">
          {subjects.map((subject) => (
            <EditalSubjectPanel
              key={subject.id}
              subject={subject}
              onEdit={() => {
                setEditingSubject(subject);
                setSubjectDialogOpen(true);
              }}
              onDelete={() => setDeleteTarget(subject.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={subjectDialogOpen}
        onOpenChange={(open) => {
          setSubjectDialogOpen(open);
          if (!open) setEditingSubject(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Editar disciplina" : "Nova disciplina"}</DialogTitle>
          </DialogHeader>
          <EditalSubjectForm
            defaultValues={editingSubject ?? undefined}
            onSubmit={handleSubmitSubject}
            submitting={createSubject.isPending || updateSubject.isPending}
            submitLabel={editingSubject ? "Salvar alterações" : "Criar disciplina"}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir disciplina</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os tópicos desta disciplina também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSubject}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
