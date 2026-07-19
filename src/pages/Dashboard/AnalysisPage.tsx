import { Link, useSearchParams } from "react-router-dom";
import { BookOpenCheck, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PlanFilterSelect } from "@/components/dashboard/PlanFilterSelect";
import { useActivePlan } from "@/hooks/useActivePlan";
import { cn } from "@/utils/cn";
import { OverviewStep } from "./steps/OverviewStep";
import { PlanProgressStep } from "./steps/PlanProgressStep";
import { PerformanceStep } from "./steps/PerformanceStep";
import { TrendsStep } from "./steps/TrendsStep";
import { DistributionStep } from "./steps/DistributionStep";

const STEPS = [
  {
    key: "visao-geral",
    label: "Visão Geral",
    question: "Como você está indo hoje e nesta semana",
    Component: OverviewStep,
  },
  {
    key: "progresso",
    label: "Progresso do Plano",
    question: "O quanto você já avançou no conteúdo do seu plano",
    Component: PlanProgressStep,
  },
  {
    key: "desempenho",
    label: "Desempenho",
    question: "Se você está realmente acertando o que estuda",
    Component: PerformanceStep,
  },
  {
    key: "tendencias",
    label: "Tendências",
    question: "Se você está mantendo constância ao longo do tempo",
    Component: TrendsStep,
  },
  {
    key: "distribuicao",
    label: "Distribuição",
    question: "Onde seu tempo de estudo está sendo investido",
    Component: DistributionStep,
  },
];

export default function AnalysisPage() {
  const { plans, activePlanId, setActivePlanId, isLoading: loadingPlans } = useActivePlan();
  const [searchParams, setSearchParams] = useSearchParams();

  const stepIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === searchParams.get("etapa"))
  );
  const step = STEPS[stepIndex];

  function goToStep(index: number) {
    setSearchParams({ etapa: STEPS[index].key });
  }

  if (!loadingPlans && plans?.length === 0) {
    return (
      <EmptyState
        icon={BookOpenCheck}
        title="Bem-vindo ao StudyHub"
        description="Crie um edital e um plano de estudos para começar a acompanhar sua evolução."
        action={
          <Button asChild>
            <Link to="/editals">Criar primeiro edital</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minha Evolução</h1>
          <p className="text-sm text-muted-foreground">
            Analise em 5 passos se você está no caminho certo
          </p>
        </div>
        <PlanFilterSelect plans={plans} activePlanId={activePlanId} onChange={setActivePlanId} />
      </div>

      <div className="flex items-center">
        {STEPS.map((s, index) => {
          const isActive = index === stepIndex;
          const isDone = index < stepIndex;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => goToStep(index)}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF] text-white shadow-md shadow-[#5B5FFB]/25"
                      : isDone
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden max-w-24 text-center text-xs leading-tight font-medium sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <span className={cn("mx-2 h-px flex-1", isDone ? "bg-primary/40" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-base font-semibold">{step.label}</h2>
        <p className="text-sm text-muted-foreground">{step.question}</p>
      </div>

      <step.Component activePlanId={activePlanId} />

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={stepIndex === 0}
          onClick={() => goToStep(stepIndex - 1)}
        >
          <ChevronLeft className="size-4" />
          Etapa anterior
        </Button>
        <Button
          size="sm"
          disabled={stepIndex === STEPS.length - 1}
          onClick={() => goToStep(stepIndex + 1)}
        >
          Próxima etapa
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
