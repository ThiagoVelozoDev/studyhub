import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { usePlan, usePlanSubjects } from "@/hooks/usePlans";
import { PlanSubjectPanel } from "./PlanSubjectPanel";

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading: loadingPlan } = usePlan(planId);
  const { data: subjects, isLoading: loadingSubjects } = usePlanSubjects(planId);

  if (loadingPlan) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!plan) {
    return <EmptyState icon={ClipboardList} title="Plano não encontrado" />;
  }

  const visibleSubjects = subjects?.filter((s) => !s.oculta) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/plans">
            <ArrowLeft className="size-4" />
            Voltar aos planos
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{plan.nome}</h1>
        {plan.descricao && <p className="text-sm text-muted-foreground">{plan.descricao}</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Disciplinas</h2>

        {loadingSubjects && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!loadingSubjects && visibleSubjects.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma disciplina neste plano"
            description="As disciplinas são copiadas do edital automaticamente ao criar o plano."
          />
        )}

        {!loadingSubjects && visibleSubjects.length > 0 && (
          <div className="space-y-3">
            {visibleSubjects.map((subject) => (
              <PlanSubjectPanel key={subject.id} planId={plan.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
