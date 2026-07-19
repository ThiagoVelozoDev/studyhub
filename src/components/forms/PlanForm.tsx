import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { planSchema, type PlanFormValues } from "@/schemas/plan.schema";
import { useEditals } from "@/hooks/useEditals";
import { StudyGoalsFields } from "./StudyGoalsFields";
import { DIAS_ESTUDO_PADRAO } from "@/constants/diasSemana";
import { Loader2 } from "lucide-react";

interface PlanFormProps {
  defaultValues?: Partial<PlanFormValues>;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  lockEdital?: boolean;
}

export function PlanForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
  lockEdital,
}: PlanFormProps) {
  const { data: editals } = useEditals();
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      editalId: "",
      nome: "",
      descricao: "",
      diasEstudo: DIAS_ESTUDO_PADRAO,
      metaDiaria: 60,
      metaSemanal: 300,
      metaMensal: 1200,
      ...defaultValues,
    },
  });

  const metaDiaria = form.watch("metaDiaria");
  const metaSemanal = form.watch("metaSemanal");
  const metaMensal = form.watch("metaMensal");
  const diasEstudo = form.watch("diasEstudo");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="editalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Edital base</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={lockEdital}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um edital" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {editals?.map((edital) => (
                    <SelectItem key={edital.id} value={edital.id}>
                      {edital.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                As disciplinas e tópicos do edital serão copiados para o plano.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do plano</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Minha preparação TRF-1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dataProva"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da prova</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <StudyGoalsFields
          metaDiaria={metaDiaria}
          onMetaDiariaChange={(v) => form.setValue("metaDiaria", v, { shouldValidate: true })}
          metaSemanal={metaSemanal}
          onMetaSemanalChange={(v) => form.setValue("metaSemanal", v, { shouldValidate: true })}
          metaMensal={metaMensal}
          onMetaMensalChange={(v) => form.setValue("metaMensal", v, { shouldValidate: true })}
          diasEstudo={diasEstudo}
          onDiasEstudoChange={(v) => form.setValue("diasEstudo", v, { shouldValidate: true })}
        />
        {form.formState.errors.diasEstudo && (
          <p className="text-sm text-destructive">{form.formState.errors.diasEstudo.message}</p>
        )}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Observações sobre o plano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
