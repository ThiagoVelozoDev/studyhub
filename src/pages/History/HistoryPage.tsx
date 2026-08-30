import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  History as HistoryIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
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
import { useAllPlanSubjects, useAllPlanTopics, usePlans, usePlanSubjects, usePlanTopics } from "@/hooks/usePlans";
import {
  useCreateStudySession,
  useDeleteStudySession,
  useStudySessions,
  useUpdateStudySession,
} from "@/hooks/useStudySessions";
import { StudySessionForm } from "@/components/forms/StudySessionForm";
import type { StudySessionFormValues } from "@/schemas/studySession.schema";
import { getSessionTypeLabel } from "@/constants/sessionTypes";
import { formatDuration } from "@/utils/datetime";
import { exportHistoryToExcel, exportHistoryToPdf, type HistoryExportRow } from "@/utils/export";
import type { StudySession } from "@/types";

const ALL = "all";

function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sessionToFormDefaults(session: StudySession): Partial<StudySessionFormValues> {
  const totalMinutes = Math.round(session.duracao / 60000);
  return {
    planoId: session.planoId,
    disciplinaId: session.disciplinaId,
    topicoId: session.topicoId,
    data: toDateInputValue(session.inicio),
    horas: Math.floor(totalMinutes / 60),
    minutos: totalMinutes % 60,
    questoesCertas: session.questoesCertas,
    questoesErradas: session.questoesErradas,
    questoesBrancas: session.questoesBrancas,
    observacoes: session.observacoes ?? "",
  };
}

export default function HistoryPage() {
  const { data: plans } = usePlans();
  const [planId, setPlanId] = useState<string>(ALL);
  const [disciplinaId, setDisciplinaId] = useState<string>(ALL);
  const [topicoId, setTopicoId] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  const effectivePlanId = planId === ALL ? undefined : planId;
  const { data: subjects } = usePlanSubjects(effectivePlanId);
  const { data: topics } = usePlanTopics(effectivePlanId, disciplinaId === ALL ? undefined : disciplinaId);
  // Sem filtro de plano, ao contrário de `subjects`/`topics` acima (que só
  // alimentam as opções dos Selects de filtro) — os mapas de nome precisam
  // resolver disciplina/tópico de sessões de qualquer plano do usuário,
  // já que a visão padrão (Plano = "Todos") mistura sessões de vários planos.
  const { data: allSubjects } = useAllPlanSubjects();
  const { data: allTopics } = useAllPlanTopics();

  const { data: sessions, isLoading } = useStudySessions({
    planoId: effectivePlanId,
    disciplinaId: disciplinaId === ALL ? undefined : disciplinaId,
    topicoId: topicoId === ALL ? undefined : topicoId,
  });
  const deleteSession = useDeleteStudySession();
  const createSession = useCreateStudySession();
  const updateSession = useUpdateStudySession();

  const subjectNameMap = useMemo(() => new Map(allSubjects?.map((s) => [s.id, s.nome])), [allSubjects]);
  const topicNameMap = useMemo(() => new Map(allTopics?.map((t) => [t.id, t.nome])), [allTopics]);
  const planNameMap = useMemo(() => new Map(plans?.map((p) => [p.id, p.nome])), [plans]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const fromTs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : undefined;
    const toTs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : undefined;
    return sessions.filter((s) => {
      if (fromTs && s.inicio < fromTs) return false;
      if (toTs && s.inicio > toTs) return false;
      return true;
    });
  }, [sessions, dateFrom, dateTo]);

  function buildExportRows(): HistoryExportRow[] {
    return filteredSessions.map((s) => ({
      data: new Date(s.inicio).toLocaleDateString("pt-BR"),
      plano: planNameMap.get(s.planoId) ?? "-",
      disciplina: subjectNameMap.get(s.disciplinaId) ?? "-",
      topico: s.topicoId ? (topicNameMap.get(s.topicoId) ?? "-") : "-",
      horaInicio: new Date(s.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      horaFim: new Date(s.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tempo: formatDuration(s.duracao),
    }));
  }

  function openCreateDialog() {
    setEditingSession(null);
    setFormOpen(true);
  }

  function openEditDialog(session: StudySession) {
    setEditingSession(session);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: StudySessionFormValues) {
    const duracao = (values.horas * 60 + values.minutos) * 60_000;
    const inicio = new Date(`${values.data}T12:00:00`).getTime();
    const input = {
      planoId: values.planoId,
      disciplinaId: values.disciplinaId,
      topicoId: values.topicoId,
      inicio,
      fim: inicio + duracao,
      duracao,
      questoesCertas: values.questoesCertas,
      questoesErradas: values.questoesErradas,
      questoesBrancas: values.questoesBrancas,
      observacoes: values.observacoes || undefined,
    };
    try {
      if (editingSession) {
        await updateSession.mutateAsync({ sessionId: editingSession.id, input });
        toast.success("Registro atualizado");
      } else {
        await createSession.mutateAsync(input);
        toast.success("Registro adicionado");
      }
      setFormOpen(false);
      setEditingSession(null);
    } catch {
      toast.error("Não foi possível salvar o registro");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSession.mutateAsync(deleteTarget);
      toast.success("Sessão excluída");
    } catch {
      toast.error("Não foi possível excluir a sessão");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Histórico</h1>
          <p className="text-sm text-muted-foreground">Todas as suas sessões de estudo</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="size-4" />
            Adicionar registro
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/history/totais">
              <ClipboardList className="size-4" />
              Lançar totais por disciplina
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportHistoryToPdf(buildExportRows())}
            disabled={filteredSessions.length === 0}
          >
            <Download className="size-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportHistoryToExcel(buildExportRows())}
            disabled={filteredSessions.length === 0}
          >
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select
              value={planId}
              onValueChange={(v) => {
                setPlanId(v);
                setDisciplinaId(ALL);
                setTopicoId(ALL);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
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
              onValueChange={(v) => {
                setDisciplinaId(v);
                setTopicoId(ALL);
              }}
              disabled={planId === ALL}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tópico</Label>
            <Select value={topicoId} onValueChange={setTopicoId} disabled={disciplinaId === ALL}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {topics?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>De</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Até</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {!isLoading && filteredSessions.length === 0 && (
        <EmptyState icon={HistoryIcon} title="Nenhuma sessão encontrada para os filtros aplicados" />
      )}

      {!isLoading && filteredSessions.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Tópico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{new Date(session.inicio).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{planNameMap.get(session.planoId) ?? "-"}</TableCell>
                    <TableCell>{subjectNameMap.get(session.disciplinaId) ?? "-"}</TableCell>
                    <TableCell>
                      {session.topicoId ? (topicNameMap.get(session.topicoId) ?? "-") : "-"}
                    </TableCell>
                    <TableCell>{getSessionTypeLabel(session.tipo)}</TableCell>
                    <TableCell>
                      {new Date(session.inicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(session.fim).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-mono">{formatDuration(session.duracao)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => openEditDialog(session)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(session.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSession(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSession ? "Editar registro" : "Adicionar registro"}</DialogTitle>
          </DialogHeader>
          <StudySessionForm
            defaultValues={editingSession ? sessionToFormDefaults(editingSession) : undefined}
            onSubmit={handleFormSubmit}
            submitting={createSession.isPending || updateSession.isPending}
            submitLabel={editingSession ? "Salvar alterações" : "Adicionar"}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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
