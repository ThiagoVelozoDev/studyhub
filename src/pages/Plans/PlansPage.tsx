import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";
import { ClipboardList, Plus, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { PlanForm } from "@/components/forms/PlanForm";
import { useCreatePlanFromEdital, useDeletePlan, usePlans } from "@/hooks/usePlans";
import type { PlanFormValues } from "@/schemas/plan.schema";

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans();
  const createPlan = useCreatePlanFromEdital();
  const deletePlan = useDeletePlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function handleCreate(values: PlanFormValues) {
    try {
      await createPlan.mutateAsync({
        editalId: values.editalId,
        nome: values.nome,
        descricao: values.descricao,
        dataProva: values.dataProva ? new Date(values.dataProva).getTime() : undefined,
        diasEstudo: values.diasEstudo,
        metaDiaria: values.metaDiaria,
        metaSemanal: values.metaSemanal,
        metaMensal: values.metaMensal,
      });
      toast.success("Plano criado a partir do edital");
      setDialogOpen(false);
    } catch {
      toast.error("Não foi possível criar o plano");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deletePlan.mutateAsync(deleteTarget);
      toast.success("Plano excluído");
    } catch {
      toast.error("Não foi possível excluir o plano");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Planos de estudo</h1>
          <p className="text-sm text-muted-foreground">Sua cópia personalizável de um edital</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Novo plano
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && plans?.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum plano criado"
          description="Crie um plano a partir de um edital para começar a estudar."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Criar plano
            </Button>
          }
        />
      )}

      {!isLoading && plans && plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const daysToExam = plan.dataProva
              ? differenceInCalendarDays(plan.dataProva, Date.now())
              : null;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <CardTitle className="text-base">{plan.nome}</CardTitle>
                    {daysToExam !== null && (
                      <Badge variant={daysToExam <= 30 ? "destructive" : "secondary"}>
                        <CalendarClock className="size-3" />
                        {daysToExam >= 0 ? `${daysToExam}d` : "Encerrado"}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.descricao && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{plan.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Meta diária: {plan.metaDiaria}min</span>
                      <span>Semanal: {plan.metaSemanal}min</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Button asChild variant="secondary" size="sm">
                        <Link to={`/plans/${plan.id}`}>Gerenciar</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(plan.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo plano</DialogTitle>
          </DialogHeader>
          <PlanForm onSubmit={handleCreate} submitting={createPlan.isPending} submitLabel="Criar plano" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá o plano e todo o seu progresso. O edital original não será afetado.
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
