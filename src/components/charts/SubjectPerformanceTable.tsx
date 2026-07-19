import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatHoursMinutes } from "@/utils/datetime";
import type { SubjectPoint } from "@/hooks/useStatistics";

interface SubjectPerformanceTableProps {
  data: SubjectPoint[];
  planId: string | undefined;
}

function accuracyClassName(pct: number): string {
  if (pct >= 70) return "border-transparent bg-green-500/15 text-green-700 dark:text-green-400";
  if (pct >= 60) return "border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
  return "border-transparent bg-red-500/15 text-red-700 dark:text-red-400";
}

export function SubjectPerformanceTable({ data, planId }: SubjectPerformanceTableProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma sessão registrada ainda.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Disciplina</TableHead>
          <TableHead>Tempo</TableHead>
          <TableHead className="text-right">Certas</TableHead>
          <TableHead className="text-right">Erradas</TableHead>
          <TableHead className="text-right">%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((subject) => (
          <TableRow key={subject.disciplinaId}>
            <TableCell className="font-medium">
              {planId ? (
                <Link to={`/plans/${planId}`} className="text-primary hover:underline">
                  {subject.nome}
                </Link>
              ) : (
                subject.nome
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatHoursMinutes(subject.minutos * 60_000)}
            </TableCell>
            <TableCell className="text-right text-green-600 dark:text-green-400">
              {subject.acertos}
            </TableCell>
            <TableCell className="text-right text-destructive">
              {subject.questoes - subject.acertos}
            </TableCell>
            <TableCell className="text-right">
              {subject.questoes > 0 ? (
                <Badge variant="outline" className={accuracyClassName(subject.percentualAcerto)}>
                  {subject.percentualAcerto}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
