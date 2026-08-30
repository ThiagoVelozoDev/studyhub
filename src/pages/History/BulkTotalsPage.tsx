import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { accuracyClassName } from "@/components/charts/SubjectPerformanceTable";
import { usePlans, usePlanSubjects } from "@/hooks/usePlans";
import { useCreateStudySessionsBatch } from "@/hooks/useStudySessions";
import type { SessionInput } from "@/hooks/useStudySessions";

interface RowValues {
  horas: string;
  minutos: string;
  certas: string;
  erradas: string;
  brancas: string;
}

const EMPTY_ROW: RowValues = { horas: "", minutos: "", certas: "", erradas: "", brancas: "" };

export default function BulkTotalsPage() {
  const navigate = useNavigate();
  const { data: plans } = usePlans();
  const [planoId, setPlanoId] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Record<string, RowValues>>({});

  const { data: subjects, isLoading } = usePlanSubjects(planoId || undefined);
  const createBatch = useCreateStudySessionsBatch();

  function updateRow(disciplinaId: string, field: keyof RowValues, value: string) {
    setRows((prev) => ({
      ...prev,
      [disciplinaId]: { ...(prev[disciplinaId] ?? EMPTY_ROW), [field]: value },
    }));
  }

  async function handleSubmit() {
    if (!planoId) return;
    const inicioBase = new Date(`${data}T12:00:00`).getTime();
    const inputs: SessionInput[] = [];

    for (const subject of subjects ?? []) {
      const row = rows[subject.id];
      if (!row) continue;
      const horas = Number(row.horas) || 0;
      const minutos = Number(row.minutos) || 0;
      const certas = row.certas ? Number(row.certas) : undefined;
      const erradas = row.erradas ? Number(row.erradas) : undefined;
      const brancas = row.brancas ? Number(row.brancas) : undefined;
      const duracao = (horas * 60 + minutos) * 60_000;
      if (duracao <= 0 && certas === undefined && erradas === undefined && brancas === undefined) {
        continue;
      }
      inputs.push({
        planoId,
        disciplinaId: subject.id,
        topicoId: undefined,
        inicio: inicioBase,
        fim: inicioBase + duracao,
        duracao,
        questoesCertas: certas,
        questoesErradas: erradas,
        questoesBrancas: brancas,
      });
    }

    if (inputs.length === 0) {
      toast.error("Preencha ao menos uma disciplina");
      return;
    }

    try {
      await createBatch.mutateAsync(inputs);
      toast.success(`${inputs.length} registro${inputs.length === 1 ? "" : "s"} lançado${inputs.length === 1 ? "" : "s"}`);
      navigate("/history");
    } catch {
      toast.error("Não foi possível lançar os totais");
    }
  }

  const visibleSubjects = subjects?.filter((s) => !s.oculta) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/history">
            <ArrowLeft className="size-4" />
            Voltar ao histórico
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Lançar totais por disciplina</h1>
        <p className="text-sm text-muted-foreground">
          Registre o tempo e as questões acumuladas de cada disciplina de uma vez só, sem
          precisar criar um registro por dia.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bulk-totals-plano">Plano</Label>
            <Select value={planoId} onValueChange={setPlanoId}>
              <SelectTrigger id="bulk-totals-plano" className="w-full">
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
            <Label htmlFor="bulk-totals-data">Data</Label>
            <Input
              id="bulk-totals-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {!planoId && (
        <EmptyState
          icon={ClipboardList}
          title="Selecione um plano para começar"
          description="As disciplinas do plano escolhido vão aparecer numa tabela para você preencher os totais."
        />
      )}

      {planoId && isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {planoId && !isLoading && visibleSubjects.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Este plano não tem disciplinas"
          description="Adicione disciplinas ao plano antes de lançar totais."
        />
      )}

      {planoId && !isLoading && visibleSubjects.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Minutos</TableHead>
                  <TableHead className="text-right">Certas</TableHead>
                  <TableHead className="text-right">Erradas</TableHead>
                  <TableHead className="text-right">Brancas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSubjects.map((subject) => {
                  const row = rows[subject.id] ?? EMPTY_ROW;
                  const certasNum = Number(row.certas) || 0;
                  const erradasNum = Number(row.erradas) || 0;
                  const total = certasNum + erradasNum;
                  const pct = total > 0 ? Math.round((certasNum / total) * 100) : null;
                  return (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium whitespace-nowrap">{subject.nome}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="w-16 text-right"
                          value={row.horas}
                          onChange={(e) => updateRow(subject.id, "horas", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          className="w-16 text-right"
                          value={row.minutos}
                          onChange={(e) => updateRow(subject.id, "minutos", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="w-16 text-right"
                          value={row.certas}
                          onChange={(e) => updateRow(subject.id, "certas", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="w-16 text-right"
                          value={row.erradas}
                          onChange={(e) => updateRow(subject.id, "erradas", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="w-16 text-right"
                          value={row.brancas}
                          onChange={(e) => updateRow(subject.id, "brancas", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{total}</TableCell>
                      <TableCell className="text-right">
                        {pct !== null ? (
                          <Badge variant="outline" className={accuracyClassName(pct)}>
                            {pct}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {planoId && !isLoading && visibleSubjects.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={createBatch.isPending}>
            {createBatch.isPending && <Loader2 className="size-4 animate-spin" />}
            Lançar totais
          </Button>
        </div>
      )}
    </div>
  );
}
