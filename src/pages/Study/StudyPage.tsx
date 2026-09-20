import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Timer as TimerIcon, ClipboardList, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { PlanTopicForm } from "@/components/forms/PlanTopicForm";
import type { PlanTopicFormValues } from "@/schemas/planTopic.schema";
import { useCreatePlanTopic, usePlans, usePlanSubjects, usePlanTopics } from "@/hooks/usePlans";
import { useCreateStudySession } from "@/hooks/useStudySessions";
import { useTimer } from "@/hooks/useTimer";
import { SESSION_TYPES, getSessionTypeLabel } from "@/constants/sessionTypes";
import type { SessionType } from "@/types";
import { formatDuration } from "@/utils/datetime";

export default function StudyPage() {
  const [searchParams] = useSearchParams();
  const { data: plans, isLoading: loadingPlans } = usePlans();

  const [planId, setPlanId] = useState(searchParams.get("planId") ?? "");
  const [disciplinaId, setDisciplinaId] = useState(searchParams.get("disciplinaId") ?? "");
  const [topicoId, setTopicoId] = useState(searchParams.get("topicoId") ?? "");
  const [tipo, setTipo] = useState<SessionType | "">("");

  const { data: subjects } = usePlanSubjects(planId || undefined);
  const { data: topics } = usePlanTopics(planId || undefined, disciplinaId || undefined);

  const timer = useTimer();
  const createSession = useCreateStudySession();
  const createTopic = useCreatePlanTopic(planId);

  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [pendingStop, setPendingStop] = useState<ReturnType<typeof timer.stop> | null>(null);
  const [questoesCertas, setQuestoesCertas] = useState("");
  const [questoesErradas, setQuestoesErradas] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [newTopicDialogOpen, setNewTopicDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    if (timer.activeTimer) {
      setPlanId(timer.activeTimer.planoId);
      setDisciplinaId(timer.activeTimer.disciplinaId);
      setTopicoId(timer.activeTimer.topicoId);
      setTipo(timer.activeTimer.tipo);
    }
  }, [timer.activeTimer]);

  const selectedPlan = useMemo(() => plans?.find((p) => p.id === planId), [plans, planId]);
  const selectedSubject = useMemo(
    () => subjects?.find((s) => s.id === disciplinaId),
    [subjects, disciplinaId]
  );
  const selectedTopic = useMemo(() => topics?.find((t) => t.id === topicoId), [topics, topicoId]);

  function handleStart() {
    if (!planId || !disciplinaId || !topicoId || !tipo) {
      toast.error("Selecione plano, disciplina, tópico e o tipo de sessão antes de iniciar");
      return;
    }
    timer.start({ planoId: planId, disciplinaId, topicoId, tipo });
  }

  function handleStop() {
    const result = timer.stop();
    setPendingStop(result);
    setFinishDialogOpen(true);
  }

  function handleConfirmDiscard() {
    timer.discard();
    setPlanId("");
    setDisciplinaId("");
    setTopicoId("");
    setTipo("");
    setDiscardDialogOpen(false);
    toast.success("Sessão descartada");
  }

  async function handleConfirmFinish() {
    if (!pendingStop) return;
    try {
      await createSession.mutateAsync({
        planoId: pendingStop.planoId,
        disciplinaId: pendingStop.disciplinaId,
        topicoId: pendingStop.topicoId,
        tipo: pendingStop.tipo,
        inicio: pendingStop.startedAt,
        fim: pendingStop.endedAt,
        duracao: pendingStop.durationMs,
        questoesCertas: questoesCertas ? Number(questoesCertas) : undefined,
        questoesErradas: questoesErradas ? Number(questoesErradas) : undefined,
        observacoes: observacoes || undefined,
      });
      toast.success("Sessão de estudo registrada");
      setFinishDialogOpen(false);
      setPendingStop(null);
      setQuestoesCertas("");
      setQuestoesErradas("");
      setObservacoes("");
    } catch {
      toast.error("Não foi possível salvar a sessão de estudo");
    }
  }

  async function handleCreateTopic(values: PlanTopicFormValues) {
    try {
      const newTopicId = await createTopic.mutateAsync({
        planoId: planId,
        disciplinaId,
        topicoOriginalId: undefined,
        nome: values.nome,
        ordem: topics?.length ?? 0,
        concluido: false,
        percentualConclusao: 0,
        tempoEstudado: 0,
        questoesResolvidas: 0,
        oculta: false,
      });
      setTopicoId(newTopicId);
      setNewTopicDialogOpen(false);
      toast.success("Tópico criado");
    } catch {
      toast.error("Não foi possível criar o tópico");
    }
  }

  const isRunning = timer.isRunning;
  const isPaused = timer.isPaused;
  const totalQuestoes = (Number(questoesCertas) || 0) + (Number(questoesErradas) || 0);

  if (!loadingPlans && plans?.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Crie um plano para começar a estudar"
        description="Você precisa de um plano de estudos com disciplinas e tópicos antes de iniciar o cronômetro."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cronômetro de estudos</h1>
        <p className="text-sm text-muted-foreground">Plano → Disciplina → Tópico → Tipo → Iniciar</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select
              value={planId}
              onValueChange={(value) => {
                setPlanId(value);
                setDisciplinaId("");
                setTopicoId("");
              }}
              disabled={isRunning || isPaused}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select
              value={disciplinaId}
              onValueChange={(value) => {
                setDisciplinaId(value);
                setTopicoId("");
              }}
              disabled={isRunning || isPaused || !planId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects
                  ?.filter((s) => !s.oculta)
                  .map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tópico</Label>
            <div className="flex gap-2">
              <Select
                value={topicoId}
                onValueChange={setTopicoId}
                disabled={isRunning || isPaused || !disciplinaId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um tópico" />
                </SelectTrigger>
                <SelectContent>
                  {topics
                    ?.filter((t) => !t.oculta)
                    .map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewTopicDialogOpen(true)}
                disabled={isRunning || isPaused || !disciplinaId}
              >
                <Plus className="size-4" />
                Novo tópico
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de sessão</Label>
            <Select
              value={tipo}
              onValueChange={(value) => setTipo(value as SessionType)}
              disabled={isRunning || isPaused}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="O que você vai fazer?" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={isRunning ? "running" : isPaused ? "paused" : "idle"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={
                  "flex size-20 items-center justify-center rounded-full " +
                  (isPaused ? "bg-muted-foreground/10 text-muted-foreground" : "bg-primary/10 text-primary")
                }
              >
                <TimerIcon className="size-9" />
              </div>
              <p className="font-mono text-5xl font-semibold tabular-nums">
                {formatDuration(timer.elapsedMs)}
              </p>
              {(isRunning || isPaused) && (
                <p className="text-sm text-muted-foreground">
                  {selectedPlan?.nome} · {selectedSubject?.nome} · {selectedTopic?.nome} ·{" "}
                  {getSessionTypeLabel(timer.activeTimer?.tipo)}
                  {isPaused && " · Pausado"}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3">
            {!isRunning && !isPaused && (
              <Button size="lg" onClick={handleStart} disabled={!planId || !disciplinaId || !topicoId || !tipo}>
                <Play className="size-5" />
                Iniciar cronômetro
              </Button>
            )}
            {isRunning && (
              <Button size="lg" variant="outline" onClick={timer.pause}>
                <Pause className="size-5" />
                Pausar
              </Button>
            )}
            {isPaused && (
              <Button size="lg" onClick={timer.resume}>
                <Play className="size-5" />
                Continuar
              </Button>
            )}
            {(isRunning || isPaused) && (
              <Button size="lg" variant="destructive" onClick={handleStop}>
                <Square className="size-5" />
                Finalizar sessão
              </Button>
            )}
            {(isRunning || isPaused) && (
              <Button size="lg" variant="outline" onClick={() => setDiscardDialogOpen(true)}>
                <Trash2 className="size-5" />
                Descartar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar sessão de estudo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingStop && (
              <p className="text-sm text-muted-foreground">
                Tempo estudado: <strong>{formatDuration(pendingStop.durationMs)}</strong>
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Questões certas</Label>
                <Input
                  type="number"
                  min={0}
                  value={questoesCertas}
                  onChange={(e) => setQuestoesCertas(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Questões erradas</Label>
                <Input
                  type="number"
                  min={0}
                  value={questoesErradas}
                  onChange={(e) => setQuestoesErradas(e.target.value)}
                />
              </div>
            </div>
            {totalQuestoes > 0 && (
              <p className="text-sm text-muted-foreground">
                Total resolvido: <strong>{totalQuestoes}</strong>
              </p>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="O que foi estudado, dificuldades, etc."
              />
            </div>
            <Button className="w-full" onClick={handleConfirmFinish} disabled={createSession.isPending}>
              Salvar sessão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newTopicDialogOpen} onOpenChange={setNewTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo tópico</DialogTitle>
          </DialogHeader>
          <PlanTopicForm
            onSubmit={handleCreateTopic}
            submitting={createTopic.isPending}
            submitLabel="Criar tópico"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar sessão de estudo?</AlertDialogTitle>
            <AlertDialogDescription>
              O tempo estudado ({formatDuration(timer.elapsedMs)}) será perdido e nada será
              salvo. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDiscard}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
