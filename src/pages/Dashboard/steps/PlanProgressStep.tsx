import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, BookOpenCheck, Map as MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { JourneyIllustration } from "@/components/dashboard/JourneyIllustration";
import { usePlanTopics } from "@/hooks/usePlans";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatHoursMinutes } from "@/utils/datetime";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const MEDALS = ["🥇", "🥈", "🥉"];

export function PlanProgressStep({ activePlanId }: { activePlanId: string | undefined }) {
  const stats = useDashboardStats(activePlanId);
  const { data: topics } = usePlanTopics(activePlanId);

  const upcomingReviews = useMemo(() => {
    if (!topics) return [];
    return topics
      .filter((t) => t.concluido && t.ultimaRevisao)
      .sort((a, b) => (a.ultimaRevisao ?? 0) - (b.ultimaRevisao ?? 0))
      .slice(0, 5);
  }, [topics]);

  const completedTopics = topics?.filter((t) => t.concluido).length ?? 0;
  const totalTopics = topics?.length ?? 0;
  const journeyPercent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="relative overflow-hidden lg:col-span-1">
        <JourneyIllustration className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-70" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapIcon className="size-4" />
            Sua jornada
          </CardTitle>
        </CardHeader>
        <CardContent className="relative flex flex-col items-center gap-4 text-center">
          <CircularProgress percent={journeyPercent} />
          <div>
            <p className="text-sm font-medium">
              {journeyPercent >= 100 ? "Parabéns, plano concluído!" : "Continue assim."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {journeyPercent >= 100
                ? "Você concluiu todos os tópicos deste plano."
                : `Faltam apenas ${Math.round(100 - journeyPercent)}%. Sua aprovação está cada vez mais próxima.`}
            </p>
          </div>
          {activePlanId && (
            <Button asChild size="sm" className="w-full">
              <Link to={`/plans/${activePlanId}`}>Ver meu plano de estudos</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            Ranking de disciplinas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.ranking.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma sessão registrada ainda.</p>
          )}
          {stats.ranking.slice(0, 6).map((item, index) => {
            const pct = stats.ranking[0]
              ? Math.round((item.totalMs / stats.ranking[0].totalMs) * 100)
              : 0;
            return (
              <div key={item.disciplinaId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-center">
                      {MEDALS[index] ?? `${index + 1}º`}
                    </span>
                    {item.nome}
                  </span>
                  <span className="text-muted-foreground">{formatHoursMinutes(item.totalMs)}</span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpenCheck className="size-4" />
            Próximas revisões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingReviews.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Conclua tópicos para receber sugestões de revisão.
            </p>
          )}
          {upcomingReviews.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{topic.nome}</span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {topic.ultimaRevisao &&
                  formatDistanceToNow(topic.ultimaRevisao, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
