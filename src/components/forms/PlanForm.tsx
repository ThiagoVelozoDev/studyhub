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
      metaDiaria: 60,
      metaSemanal: 300,
      metaMensal: 1200,
      ...defaultValues,
    },
  });

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
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="metaDiaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta diária (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metaSemanal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta semanal (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metaMensal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta mensal (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
