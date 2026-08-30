import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { planTopicSchema, type PlanTopicFormValues } from "@/schemas/planTopic.schema";

interface PlanTopicFormProps {
  defaultValues?: Partial<PlanTopicFormValues>;
  onSubmit: (values: PlanTopicFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

export function PlanTopicForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: PlanTopicFormProps) {
  const form = useForm<PlanTopicFormValues>({
    resolver: zodResolver(planTopicSchema),
    defaultValues: {
      nome: "",
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
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
