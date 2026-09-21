import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, ClipboardList, Printer, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PlanFilterSelect } from "@/components/dashboard/PlanFilterSelect";
import { ScheduleConfigForm } from "@/components/forms/ScheduleConfigForm";
import { useActivePlan } from "@/hooks/useActivePlan";
import { usePlan, usePlanSubjects } from "@/hooks/usePlans";
import { useEdital } from "@/hooks/useEditals";
import {
  useSchedules,
  useScheduleItems,
  useCreateSchedule,
  useRestoreSchedule,
  useUpdateScheduleItem,
} from "@/hooks/useSchedules";
import { computeScheduleProgress } from "@/utils/scheduleProgress";
import { ScheduleCover } from "./ScheduleCover";
import { ScheduleWeekGrid } from "./ScheduleWeekGrid";
import { ArchivedSchedulesList } from "./ArchivedSchedulesList";
import type { ScheduleConfigFormValues } from "@/schemas/schedule.schema";
import type { ScheduleItem } from "@/types";

export default function SchedulePage() {
  const { plans, activePlanId, setActivePlanId, isLoading: loadingPlans } = useActivePlan();
  const { data: plan } = usePlan(activePlanId);
  const { data: edital } = useEdital(plan?.editalId);
  const { data: subjects, isLoading: loadingSubjects } = usePlanSubjects(activePlanId);
  const { data: schedules, isLoading: loadingSchedules } = useSchedules(activePlanId);
  const activeSchedule = schedules?.find((s) => s.status === "ativo");
  const archivedSchedules = schedules?.filter((s) => s.status === "arquivado") ?? [];
  const { data: items, isLoading: loadingItems } = useScheduleItems(activeSchedule?.id);

  const createSchedule = useCreateSchedule(activePlanId);
  const restoreSchedule = useRestoreSchedule(activePlanId);
  const updateItem = useUpdateScheduleItem(activeSchedule?.id);

  const [configOpen, setConfigOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | undefined>();
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    setCurrentWeek(1);
  }, [activeSchedule?.id]);

  const visibleSubjects = subjects?.filter((s) => !s.oculta) ?? [];
  const subjectsById = new Map(visibleSubjects.map((s) => [s.id, s]));
  const weekItems = items?.filter((item) => item.semana === currentWeek) ?? [];
  const progressPercent = computeScheduleProgress(items);

  function handlePrevWeek() {
    if (!activeSchedule) return;
    setCurrentWeek((w) => (w <= 1 ? activeSchedule.numeroSemanas : w - 1));
  }

  function handleNextWeek() {
    if (!activeSchedule) return;
    setCurrentWeek((w) => (w >= activeSchedule.numeroSemanas ? 1 : w + 1));
  }

  async function handleGenerate(values: ScheduleConfigFormValues) {
    try {
      await createSchedule.mutateAsync(values);
      toast.success("Cronograma gerado");
      setConfigOpen(false);
    } catch {
      toast.error("Não foi possível gerar o cronograma");
    }
  }

  async function handleRestore(scheduleId: string) {
    setRestoringId(scheduleId);
    try {
      await restoreSchedule.mutateAsync(scheduleId);
      toast.success("Cronograma restaurado");
    } catch {
      toast.error("Não foi possível restaurar o cronograma");
    } finally {
      setRestoringId(undefined);
    }
  }

  async function handleToggleItem(item: ScheduleItem, concluido: boolean) {
    try {
      await updateItem.mutateAsync({ itemId: item.id, concluido });
    } catch {
      toast.error("Não foi possível atualizar o item");
    }
  }

  if (loadingPlans) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhum plano de estudos criado"
        description="Crie um plano a partir de um edital para gerar um cronograma."
        action={
          <Button asChild>
            <Link to="/plans">Ir para Planos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cronograma</h1>
          <p className="text-sm text-muted-foreground">
            Grade semanal gerada a partir das disciplinas do plano
          </p>
        </div>
        <div className="print:hidden">
          <PlanFilterSelect plans={plans} activePlanId={activePlanId} onChange={setActivePlanId} />
        </div>
      </div>

      {(loadingSubjects || loadingSchedules) && (
        <div className="space-y-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {!loadingSubjects && !loadingSchedules && plan && visibleSubjects.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Este plano não tem disciplinas visíveis"
          description="Adicione ou reative disciplinas no plano antes de gerar um cronograma."
          action={
            <Button asChild variant="secondary">
              <Link to={`/plans/${plan.id}`}>Ver plano</Link>
            </Button>
          }
        />
      )}

      {!loadingSubjects && !loadingSchedules && plan && visibleSubjects.length > 0 && !activeSchedule && (
        <EmptyState
          icon={Settings2}
          title="Nenhum cronograma configurado"
          description="Responda 3 perguntas rápidas e o sistema monta um cronograma semanal com as disciplinas deste plano."
          action={<Button onClick={() => setConfigOpen(true)}>Configurar cronograma</Button>}
        />
      )}

      {activeSchedule && plan && (
        <div className="space-y-6">
          <ScheduleCover
            edital={edital}
            plan={plan}
            schedule={activeSchedule}
            currentWeek={currentWeek}
            progressPercent={progressPercent}
          />

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="secondary" onClick={() => setConfigOpen(true)}>
              <Settings2 className="size-4" />
              Reconfigurar
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Imprimir
            </Button>
          </div>

          {loadingItems && <Skeleton className="h-64 w-full rounded-xl" />}
          {!loadingItems && items && (
            <ScheduleWeekGrid
              items={weekItems}
              subjectsById={subjectsById}
              onToggleItem={handleToggleItem}
              currentWeek={currentWeek}
              totalWeeks={activeSchedule.numeroSemanas}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
            />
          )}

          <div className="print:hidden">
            <ArchivedSchedulesList
              schedules={archivedSchedules}
              onRestore={handleRestore}
              restoringId={restoringId}
            />
          </div>
        </div>
      )}

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeSchedule ? "Reconfigurar cronograma" : "Configurar cronograma"}</DialogTitle>
          </DialogHeader>
          <ScheduleConfigForm
            subjects={visibleSubjects}
            defaultValues={
              activeSchedule
                ? {
                    minutosPorDia: activeSchedule.minutosPorDia,
                    questoesPorDia: activeSchedule.questoesPorDia,
                    diasEstudo: activeSchedule.diasEstudo,
                    materiasPorDia: activeSchedule.materiasPorDia,
                  }
                : { diasEstudo: plan?.diasEstudo ?? [] }
            }
            onSubmit={handleGenerate}
            submitting={createSchedule.isPending}
            submitLabel={activeSchedule ? "Gerar novo cronograma" : "Gerar cronograma"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
