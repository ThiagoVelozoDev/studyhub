import type { CSSProperties } from "react";
import { getCareerTheme } from "@/constants/careerThemes";
import { DIAS_SEMANA } from "@/constants/diasSemana";
import { formatHoursMinutes } from "@/utils/datetime";
import type { Edital, Plan, Schedule } from "@/types";

interface ScheduleCoverProps {
  edital: Edital | null | undefined;
  plan: Plan;
  schedule: Schedule;
  currentWeek: number;
  progressPercent: number;
}

export function ScheduleCover({ edital, plan, schedule, currentWeek, progressPercent }: ScheduleCoverProps) {
  const diasLabel = DIAS_SEMANA.filter((d) => schedule.diasEstudo.includes(d.value))
    .map((d) => d.label)
    .join(", ");

  const theme = getCareerTheme(edital?.categoria);
  const Icon = theme.icon;
  const phrase = theme.motivationalPhrases[currentWeek % theme.motivationalPhrases.length];

  const heroStyle = {
    ["--hero-primary" as string]: theme.colors.primary,
    ["--hero-surface" as string]: theme.colors.surface,
    ["--hero-text" as string]: theme.colors.text,
    ["--hero-muted" as string]: theme.colors.muted,
    backgroundColor: theme.colors.background,
    // Camadas: overlay (contraste do texto) + foto real (pode 404) + gradiente
    // do tema (fallback sempre presente). Se a foto não existir/carregar, o
    // navegador simplesmente não pinta aquela camada — o gradiente aparece
    // sozinho, sem flicker e sem precisar de onError em JS. Também é o que
    // imprime (ver comentário abaixo).
    backgroundImage: [
      "linear-gradient(to top, var(--hero-surface) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 100%)",
      `url(${theme.backgroundImage})`,
      theme.gradient,
    ].join(", "),
    backgroundSize: "cover, cover, cover",
    backgroundPosition: "center, center, center",
  } as CSSProperties;

  return (
    // Hero rico com tema da carreira — mesmo visual na tela e na
    // impressão/PDF (window.print()). `print-color-adjust: exact` evita
    // que o navegador clareie as cores do tema para economizar tinta; a
    // foto/cores só aparecem impressas se o usuário habilitar "Imprimir
    // gráficos de segundo plano" no diálogo de impressão — limitação do
    // navegador, não contornável só com CSS.
    <div className="relative overflow-hidden rounded-xl border print:[print-color-adjust:exact]" style={heroStyle}>
      <div className="relative z-10 space-y-4 p-6 sm:p-8" style={{ color: theme.colors.text }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.colors.muted }}>
            Cronograma de estudos — {plan.nome}
          </p>
          {schedule.numeroSemanas > 1 && (
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}
            >
              Semana {currentWeek} de {schedule.numeroSemanas}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.colors.surface, color: theme.colors.primary }}
          >
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
              {theme.name}
            </p>
            <h2 className="truncate text-2xl font-semibold break-words">{edital?.nome ?? "Edital"}</h2>
          </div>
        </div>

        {edital && (
          <div className="flex flex-wrap gap-2">
            {[edital.orgao, edital.cargo, edital.banca].map((label) => (
              <span
                key={label}
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{ borderColor: theme.colors.primary, color: theme.colors.text }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: theme.colors.muted }}>
          <span>{formatHoursMinutes(schedule.minutosPorDia * 60000)} por dia</span>
          <span>{schedule.questoesPorDia} questões por dia</span>
          <span>{schedule.materiasPorDia} matérias por dia</span>
          <span>{diasLabel}</span>
        </div>

        <div className="max-w-md space-y-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: theme.colors.muted }}>
            <span>Progresso do cronograma</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.colors.surface }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, backgroundColor: theme.colors.primary }}
            />
          </div>
        </div>

        <p className="text-sm italic">{phrase}</p>
      </div>
    </div>
  );
}
