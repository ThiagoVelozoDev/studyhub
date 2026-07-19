import { GraduationCap, ShieldCheck, Target, BarChart3, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/utils/cn";

const FEATURES = [
  {
    icon: Target,
    iconBg: "bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF]",
    title: "Planos personalizados",
    description: "Monte planos de estudo sob medida para seus objetivos.",
  },
  {
    icon: BarChart3,
    iconBg: "bg-gradient-to-br from-[#3B82F6] to-[#2563EB]",
    title: "Acompanhe seu progresso",
    description: "Visualize estatísticas e identifique seus pontos de melhoria.",
  },
  {
    icon: Clock,
    iconBg: "bg-gradient-to-br from-[#22C55E] to-[#16A34A]",
    title: "Estude com eficiência",
    description: "Técnicas e ferramentas para otimizar seu tempo.",
  },
];

const PREVIEW_SPARKLINE = [3, 5, 4, 6, 5, 7, 8];

export function LoginBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between bg-[#111827] p-10 lg:flex xl:p-14">
      <div
        className="pointer-events-none absolute top-8 right-8 size-40 overflow-hidden opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative z-10 space-y-8">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF] text-white shadow-lg shadow-[#5B5FFB]/30">
            <GraduationCap className="size-5" />
          </div>
          <span className="text-lg font-semibold text-white">StudyHub</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl leading-tight font-bold text-white xl:text-[2.75rem]">
            Seu plano.
            <br />
            Seu futuro.
          </h1>
          <p className="max-w-sm text-sm text-slate-400">
            Organize seus estudos, acompanhe seu progresso e conquiste a aprovação.
          </p>
        </div>

        <div className="space-y-5">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  feature.iconBg
                )}
              >
                <feature.icon className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="text-xs text-slate-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-sm rounded-2xl bg-gradient-to-br from-[#1E2338] to-[#111827] p-4">
          <p className="text-sm leading-relaxed text-white/80">
            <span className="mr-1 align-top text-lg text-[#7B61FF]">"</span>
            Disciplina hoje, conquista amanhã. O esforço de agora é o resultado de depois.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="size-4" />
        Seus dados estão 100% seguros
      </div>

      <div className="pointer-events-none absolute top-1/2 -right-10 z-20 hidden w-80 -translate-y-1/2 rotate-1 xl:block">
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/40">
          <div className="flex">
            <div className="flex w-10 flex-col items-center gap-3 bg-[#111827] py-4">
              {NAV_ITEMS.map((item, index) => (
                <div
                  key={item.path}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md",
                    index === 0
                      ? "bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF] text-white"
                      : "text-slate-500"
                  )}
                >
                  <item.icon className="size-3.5" />
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-3 p-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Bem-vindo de volta,</p>
                <p className="text-sm font-semibold">Concurseiro(a)! 👋</p>
              </div>

              <div className="rounded-xl border border-border/60 p-2.5">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Plano em andamento</span>
                  <span className="font-medium">68%</span>
                </div>
                <p className="mb-1.5 text-xs font-medium">Polícia Federal - Agente</p>
                <Progress value={68} className="h-1.5" />
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div>
                  <p className="text-sm font-bold">12</p>
                  <p className="text-[9px] text-muted-foreground">Matérias</p>
                </div>
                <div>
                  <p className="text-sm font-bold">86</p>
                  <p className="text-[9px] text-muted-foreground">Tópicos</p>
                </div>
                <div>
                  <p className="text-sm font-bold">1.248</p>
                  <p className="text-[9px] text-muted-foreground">Questões</p>
                </div>
              </div>

              <div className="relative rounded-xl bg-muted/50 p-2.5">
                <p className="mb-1 text-[11px] text-muted-foreground">Estudos esta semana</p>
                <Sparkline
                  values={PREVIEW_SPARKLINE}
                  className="h-6 w-full text-[#5B5FFB]"
                  strokeColor="#5B5FFB"
                />
                <span className="absolute top-2 right-2 rounded-full bg-[#5B5FFB] px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">
                  12h 45m
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#5B5FFB]" />
                  <p className="flex-1 truncate text-[11px]">Direito Administrativo</p>
                  <span className="shrink-0 text-[9px] text-muted-foreground">Hoje · 19:00</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#22C55E]" />
                  <p className="flex-1 truncate text-[11px]">Raciocínio Lógico</p>
                  <span className="shrink-0 text-[9px] text-muted-foreground">Amanhã · 08:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
