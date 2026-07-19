import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Target,
  TrendingUp,
  History as HistoryIcon,
  BookOpenCheck,
  CheckCircle2,
  CalendarCheck,
  Flame,
  Map as MapIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { JourneyIllustration } from "@/components/dashboard/JourneyIllustration";
import { useAuth } from "@/contexts/AuthContext";
import { usePlans, usePlanTopics } from "@/hooks/usePlans";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatHoursMinutes } from "@/utils/datetime";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const MEDALS = ["🥇", "🥈", "🥉"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const [planId, setPlanId] = useState<string | undefined>(undefined);
  const activePlanId = planId ?? plans?.[0]?.id;

  const stats = useDashboardStats(activePlanId);
  const { data: topics } = usePlanTopics(activePlanId);

  const upcomingReviews = useMemo(() => {
    if (!topics) return [];
    return topics
      .filter((t) => t.concluido && t.ultimaRevisao)
      .sort((a, b) => (a.ultimaRevisao ?? 0) - (b.ultimaRevisao ?? 0))
      .slice(0, 5);
  }, [topics]);

  const topicNameById = useMemo(() => new Map((topics ?? []).map((t) => [t.id, t.nome])), [topics]);

  const completedTopics = topics?.filter((t) => t.concluido).length ?? 0;
  const totalTopics = topics?.length ?? 0;
  const journeyPercent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  const firstName = (user?.displayName ?? user?.email ?? "").split(/[\s@]/)[0] || "";

  if (!loadingPlans && plans?.length === 0) {
    return (
      <EmptyState
        icon={BookOpenCheck}
        title="Bem-vindo ao StudyHub"
        description="Crie um edital e um plano de estudos para começar a acompanhar seu progresso."
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
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Cada tópico concluído aproxima você da aprovação.
          </p>
        </div>
        {plans && plans.length > 1 && (
          <Select value={activePlanId} onValueChange={setPlanId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Tempo estudado hoje"
            value={formatHoursMinutes(stats.today)}
            secondary={`${formatHoursMinutes(stats.week)} esta semana`}
            variant="purple"
            sparklineValues={stats.last7Days}
            delay={0}
          />
          <StatCard
            icon={CheckCircle2}
            label="Tópicos concluídos"
            value={String(completedTopics)}
            secondary={totalTopics > 0 ? `de ${totalTopics} no plano` : undefined}
            variant="green"
            delay={0.05}
          />
          <StatCard
            icon={CalendarCheck}
            label="Sessões de estudo"
            value={String(stats.sessionsTotal)}
            secondary={`+${stats.sessionsWeek} esta semana`}
            variant="orange"
            delay={0.1}
          />
          <StatCard
            icon={Flame}
            label="Sequência"
            value={`${stats.streak} ${stats.streak === 1 ? "dia" : "dias"}`}
            secondary="Continue estudando todo dia"
            variant="blue"
            delay={0.15}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4" />
              Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoalProgress label="Diária" current={stats.today} goal={stats.metaDiariaMs} />
            <GoalProgress label="Semanal" current={stats.week} goal={stats.metaSemanalMs} />
            <GoalProgress label="Mensal" current={stats.month} goal={stats.metaMensalMs} />
            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
              <span className="text-muted-foreground">Total estudado</span>
              <span className="font-medium">{formatHoursMinutes(stats.total)}</span>
            </div>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <HistoryIcon className="size-4" />
              Últimas atividades
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/history">Ver histórico completo</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma sessão de estudo registrada ainda.</p>
            )}
            <ul className="space-y-0">
              {stats.recentActivities.map((session, index) => (
                <motion.li
                  key={session.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < stats.recentActivities.length - 1 && (
                    <span className="absolute top-8 left-[15px] h-full w-px bg-border" />
                  )}
                  <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpenCheck className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm font-medium">
                      {topicNameById.get(session.topicoId) ?? "Sessão de estudo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(session.inicio, { addSuffix: true, locale: ptBR })} ·{" "}
                      {formatHoursMinutes(session.duracao)}
                      {(session.questoesCertas || session.questoesErradas) &&
                        ` · ${(session.questoesCertas ?? 0) + (session.questoesErradas ?? 0)} questões`}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}

function GoalProgress({ label, current, goal }: { label: string; current: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {formatHoursMinutes(current)} / {goal > 0 ? formatHoursMinutes(goal) : "—"}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
