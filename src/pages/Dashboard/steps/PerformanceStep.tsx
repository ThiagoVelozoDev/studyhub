import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectPerformanceTable } from "@/components/charts/SubjectPerformanceTable";
import { useStatistics } from "@/hooks/useStatistics";

export function PerformanceStep({ activePlanId }: { activePlanId: string | undefined }) {
  const stats = useStatistics(activePlanId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Desempenho por disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <SubjectPerformanceTable data={stats.hoursBySubject} planId={activePlanId} />
        )}
      </CardContent>
    </Card>
  );
}
