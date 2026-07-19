import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { editalTopicSchema, type EditalTopicFormValues } from "@/schemas/edital.schema";
import { Loader2 } from "lucide-react";

interface EditalTopicFormProps {
  defaultValues?: Partial<EditalTopicFormValues>;
  onSubmit: (values: EditalTopicFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

export function EditalTopicForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: EditalTopicFormProps) {
  const form = useForm<EditalTopicFormValues>({
    resolver: zodResolver(editalTopicSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      cargaHorariaSugerida: undefined,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do tópico</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Controle de Constitucionalidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cargaHorariaSugerida"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carga horária sugerida (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Detalhes do tópico" {...field} />
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
