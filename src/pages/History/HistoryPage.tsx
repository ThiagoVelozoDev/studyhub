import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, History as HistoryIcon, Trash2 } from "lucide-react";
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
import { usePlans, usePlanSubjects, usePlanTopics } from "@/hooks/usePlans";
import { useDeleteStudySession, useStudySessions } from "@/hooks/useStudySessions";
import { formatDuration } from "@/utils/datetime";
import { exportHistoryToExcel, exportHistoryToPdf, type HistoryExportRow } from "@/utils/export";

const ALL = "all";

export default function HistoryPage() {
  const { data: plans } = usePlans();
  const [planId, setPlanId] = useState<string>(ALL);
  const [disciplinaId, setDisciplinaId] = useState<string>(ALL);
  const [topicoId, setTopicoId] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const effectivePlanId = planId === ALL ? undefined : planId;
  const { data: subjects } = usePlanSubjects(effectivePlanId);
  const { data: topics } = usePlanTopics(effectivePlanId, disciplinaId === ALL ? undefined : disciplinaId);
  const { data: allTopics } = usePlanTopics(effectivePlanId);

  const { data: sessions, isLoading } = useStudySessions({
    planoId: effectivePlanId,
    disciplinaId: disciplinaId === ALL ? undefined : disciplinaId,
    topicoId: topicoId === ALL ? undefined : topicoId,
  });
  const deleteSession = useDeleteStudySession();

  const subjectNameMap = useMemo(() => new Map(subjects?.map((s) => [s.id, s.nome])), [subjects]);
  const topicNameMap = useMemo(
    () => new Map(allTopics?.map((t) => [t.id, t.nome])),
    [allTopics]
  );
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
      topico: topicNameMap.get(s.topicoId) ?? "-",
      horaInicio: new Date(s.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      horaFim: new Date(s.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tempo: formatDuration(s.duracao),
    }));
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
                    <TableCell>{topicNameMap.get(session.topicoId) ?? "-"}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(session.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
