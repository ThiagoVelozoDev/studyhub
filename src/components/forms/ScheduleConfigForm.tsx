import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { WeekDaySelector } from "./WeekDaySelector";
import { scheduleConfigSchema, type ScheduleConfigFormValues } from "@/schemas/schedule.schema";
import { computeNumeroSemanas, computeScheduleCapacity } from "@/utils/scheduleGenerator";
import { sortSubjectsByPriority, type SchedulePriority } from "@/utils/subjectPriority";
import { cn } from "@/utils/cn";
import type { PlanSubject } from "@/types";

interface ScheduleConfigFormProps {
  subjects: PlanSubject[];
  defaultValues?: Partial<ScheduleConfigFormValues>;
  onSubmit: (values: ScheduleConfigFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

const PRIORITY_OPTIONS: { value: SchedulePriority; label: string; recommended?: boolean }[] = [
  { value: "intercalado", label: "Intercalado", recommended: true },
  { value: "basicas", label: "Básicas primeiro" },
  { value: "especificas", label: "Específicas primeiro" },
];

export function ScheduleConfigForm({
  subjects,
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Gerar cronograma",
}: ScheduleConfigFormProps) {
  const form = useForm<ScheduleConfigFormValues>({
    resolver: zodResolver(scheduleConfigSchema),
    defaultValues: {
      minutosPorDia: 120,
      questoesPorDia: 20,
      diasEstudo: [],
      materiasPorDia: 2,
      modo: "todas",
      prioridade: "ordem",
      ...defaultValues,
    },
  });

  const diasEstudo = form.watch("diasEstudo");
  const materiasPorDia = form.watch("materiasPorDia");
  const modo = form.watch("modo");
  const prioridade = form.watch("prioridade");

  const capacidade = computeScheduleCapacity(diasEstudo.length, materiasPorDia || 0);
  const mismatch = diasEstudo.length > 0 && materiasPorDia > 0 && subjects.length > capacidade;
  const numeroSemanasSeTodas = mismatch ? computeNumeroSemanas(subjects.length, capacidade) : 1;
  const ordenadas = mismatch ? sortSubjectsByPriority(subjects, prioridade) : subjects;
  const incluidas = mismatch && modo === "focar" ? ordenadas.slice(0, capacidade) : ordenadas;
  const excluidas = mismatch && modo === "focar" ? ordenadas.slice(capacidade) : [];

  useEffect(() => {
    if (!mismatch) {
      form.setValue("modo", "todas");
      form.setValue("prioridade", "ordem");
    } else if (prioridade === "ordem") {
      form.setValue("prioridade", "intercalado");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mismatch]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Disciplinas deste plano</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 rounded-lg bg-muted/40 px-3 py-2">
            {subjects.map((subject) => (
              <span key={subject.id} className="flex items-center gap-1.5 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.cor }} />
                {subject.nome}
              </span>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="minutosPorDia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantas horas você quer estudar por dia?</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={field.value ? field.value / 60 : ""}
                  onChange={(e) => {
                    const horas = e.target.value === "" ? undefined : Number(e.target.value);
                    field.onChange(horas === undefined ? undefined : Math.round(horas * 60));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="questoesPorDia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantas questões você quer resolver por dia?</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="materiasPorDia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantas matérias você quer estudar por dia?</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Em quais dias da semana você vai estudar?</FormLabel>
          <WeekDaySelector
            value={diasEstudo}
            onChange={(v) => form.setValue("diasEstudo", v, { shouldValidate: true })}
          />
          {form.formState.errors.diasEstudo && (
            <p className="text-sm text-destructive">{form.formState.errors.diasEstudo.message}</p>
          )}
        </div>

        {mismatch && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm">
              Você tem <strong>{subjects.length}</strong> disciplinas, mas essa configuração cobre{" "}
              <strong>{capacidade}</strong> por semana ({diasEstudo.length} dias × {materiasPorDia}{" "}
              matérias). Como você quer resolver isso?
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => form.setValue("modo", "todas", { shouldValidate: true })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  modo === "todas" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
              >
                <p className="font-medium">Estudar todas, revezando por semanas</p>
                <p className="text-xs text-muted-foreground">
                  Serão {numeroSemanasSeTodas} semanas, repetindo em loop depois da última.
                </p>
              </button>
              <button
                type="button"
                onClick={() => form.setValue("modo", "focar", { shouldValidate: true })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  modo === "focar" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
              >
                <p className="font-medium">Focar em um grupo agora</p>
                <p className="text-xs text-muted-foreground">
                  Entram {capacidade} de {subjects.length}; o resto fica de fora por enquanto.
                </p>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">O que priorizar primeiro?</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue("prioridade", opt.value, { shouldValidate: true })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      prioridade === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <p className="font-medium">{opt.label}</p>
                    {opt.recommended && <p className="text-xs text-primary">Recomendado</p>}
                  </button>
                ))}
              </div>
            </div>

            {modo === "focar" && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Entram: </span>
                  {incluidas.map((s) => s.nome).join(", ")}
                </p>
                {excluidas.length > 0 && (
                  <p>
                    <span className="font-medium text-foreground">Ficam de fora por enquanto: </span>
                    {excluidas.map((s) => s.nome).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
