import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, Play, CheckCircle2, Circle, Trash2, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { usePlanTopics, useDeletePlanTopic, useUpdatePlanTopic } from "@/hooks/usePlans";
import { formatHoursMinutes } from "@/utils/datetime";
import { cn } from "@/utils/cn";
import type { PlanSubject } from "@/types";

export function PlanSubjectPanel({ planId, subject }: { planId: string; subject: PlanSubject }) {
  const [expanded, setExpanded] = useState(true);
  const { data: topics, isLoading } = usePlanTopics(planId, subject.id);
  const updateTopic = useUpdatePlanTopic(planId);
  const deleteTopic = useDeletePlanTopic(planId);
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const visibleTopics = topics?.filter((t) => !t.oculta) ?? [];
  const completedCount = visibleTopics.filter((t) => t.concluido).length;
  const progressPct = visibleTopics.length
    ? Math.round((completedCount / visibleTopics.length) * 100)
    : 0;

  async function toggleConcluido(topicId: string, concluido: boolean) {
    try {
      await updateTopic.mutateAsync({
        topicId,
        input: { concluido, percentualConclusao: concluido ? 100 : 0 },
      });
    } catch {
      toast.error("Não foi possível atualizar o tópico");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTopic.mutateAsync(deleteTarget);
      toast.success("Tópico removido do plano");
    } catch {
      toast.error("Não foi possível remover o tópico");
    } finally {
      setDeleteTarget(null);
    }
  }

  function startTimer(topicId: string) {
    navigate(
      `/study?planId=${planId}&disciplinaId=${subject.id}&topicoId=${topicId}`
    );
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
        <span className="text-xs text-muted-foreground">
          {completedCount}/{visibleTopics.length}
        </span>
        <Progress value={progressPct} className="w-24" />
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border/60 px-4 py-3">
          {isLoading && <Skeleton className="h-10 w-full" />}
          {!isLoading && visibleTopics.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Nenhum tópico visível.</p>
          )}
          {!isLoading &&
            visibleTopics.map((topic) => (
              <div key={topic.id} className="rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleConcluido(topic.id, !topic.concluido)}>
                    {topic.concluido ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", topic.concluido && "line-through text-muted-foreground")}>
                      {topic.nome}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatHoursMinutes(topic.tempoEstudado)}</span>
                      {topic.questoesResolvidas > 0 && (
                        <span>{topic.questoesResolvidas} questões</span>
                      )}
                      {topic.observacoes && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          nota
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => startTimer(topic.id)}>
                    <Play className="size-3.5" />
                    Estudar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(topic.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tópico do plano</AlertDialogTitle>
            <AlertDialogDescription>
              O tópico será removido apenas deste plano. O tópico original do edital não é afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
