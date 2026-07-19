import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Target, History as HistoryIcon, BookOpenCheck, CheckCircle2, CalendarCheck, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { usePlanTopics } from "@/hooks/usePlans";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { formatHoursMinutes } from "@/utils/datetime";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function OverviewStep({ activePlanId }: { activePlanId: string | undefined }) {
  const { user } = useAuth();
  const stats = useDashboardStats(activePlanId);
  const { data: topics } = usePlanTopics(activePlanId);

  const topicNameById = useMemo(() => new Map((topics ?? []).map((t) => [t.id, t.nome])), [topics]);
  const completedTopics = topics?.filter((t) => t.concluido).length ?? 0;
  const totalTopics = topics?.length ?? 0;
  const firstName = (user?.displayName ?? user?.email ?? "").split(/[\s@]/)[0] || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}! 👋
        </h2>
        <p className="text-sm text-muted-foreground">Cada tópico concluído aproxima você da aprovação.</p>
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
      </div>
    </div>
  );
}
