import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FileText, Plus, ExternalLink, Trash2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EditalForm } from "@/components/forms/EditalForm";
import { useCreateEdital, useDeleteEdital, useEditals } from "@/hooks/useEditals";
import { ImportEditalDialog } from "./ImportEditalDialog";
import type { EditalStatus } from "@/types";
import type { EditalFormValues } from "@/schemas/edital.schema";

const STATUS_LABEL: Record<EditalStatus, string> = {
  ativo: "Ativo",
  rascunho: "Rascunho",
  encerrado: "Encerrado",
};

const STATUS_VARIANT: Record<EditalStatus, "default" | "secondary" | "outline"> = {
  ativo: "default",
  rascunho: "secondary",
  encerrado: "outline",
};

export default function EditalsPage() {
  const { data: editals, isLoading } = useEditals();
  const createEdital = useCreateEdital();
  const deleteEdital = useDeleteEdital();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function handleCreate(values: EditalFormValues) {
    try {
      await createEdital.mutateAsync({
        nome: values.nome,
        orgao: values.orgao,
        cargo: values.cargo,
        banca: values.banca,
        descricao: values.descricao,
        linkEdital: values.linkEdital,
        status: values.status,
        dataPublicacao: values.dataPublicacao ? new Date(values.dataPublicacao).getTime() : undefined,
      });
      toast.success("Edital criado com sucesso");
      setDialogOpen(false);
    } catch {
      toast.error("Não foi possível criar o edital");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEdital.mutateAsync(deleteTarget);
      toast.success("Edital excluído");
    } catch {
      toast.error("Não foi possível excluir o edital");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editais</h1>
          <p className="text-sm text-muted-foreground">
            Templates reutilizáveis de disciplinas e tópicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FileJson className="size-4" />
            Importar JSON
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Novo edital
          </Button>
        </div>
      </div>

      <ImportEditalDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && editals?.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Nenhum edital cadastrado"
          description="Crie um edital para começar a organizar disciplinas e tópicos."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Criar edital
            </Button>
          }
        />
      )}

      {!isLoading && editals && editals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editals.map((edital, index) => (
            <motion.div
              key={edital.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
            >
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{edital.nome}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {edital.orgao} · {edital.cargo}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[edital.status]}>
                    {STATUS_LABEL[edital.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Banca: {edital.banca}</p>
                  {edital.descricao && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{edital.descricao}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link to={`/editals/${edital.id}`}>Gerenciar</Link>
                    </Button>
                    <div className="flex items-center gap-1">
                      {edital.linkEdital && (
                        <Button asChild variant="ghost" size="icon">
                          <a href={edital.linkEdital} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(edital.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo edital</DialogTitle>
          </DialogHeader>
          <EditalForm
            onSubmit={handleCreate}
            submitting={createEdital.isPending}
            submitLabel="Criar edital"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir edital</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o edital e todas as suas disciplinas e tópicos. Planos já criados
              a partir dele não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
