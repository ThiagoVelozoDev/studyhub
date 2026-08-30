import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
} from "@/components/ui/form";
import { studySessionSchema, type StudySessionFormValues } from "@/schemas/studySession.schema";
import { usePlans, usePlanSubjects, usePlanTopics } from "@/hooks/usePlans";

const NO_TOPIC = "none";

interface StudySessionFormProps {
  defaultValues?: Partial<StudySessionFormValues>;
  onSubmit: (values: StudySessionFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

export function StudySessionForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: StudySessionFormProps) {
  const form = useForm<StudySessionFormValues>({
    resolver: zodResolver(studySessionSchema),
    defaultValues: {
      planoId: "",
      disciplinaId: "",
      topicoId: undefined,
      data: new Date().toISOString().slice(0, 10),
      horas: 0,
      minutos: 0,
      questoesCertas: undefined,
      questoesErradas: undefined,
      questoesBrancas: undefined,
      observacoes: "",
      ...defaultValues,
    },
  });

  const planoId = form.watch("planoId");
  const disciplinaId = form.watch("disciplinaId");

  const { data: plans } = usePlans();
  const { data: subjects } = usePlanSubjects(planoId || undefined);
  const { data: topics } = usePlanTopics(planoId || undefined, disciplinaId || undefined);

  async function handleSubmit(values: StudySessionFormValues) {
    await onSubmit({
      ...values,
      topicoId: values.topicoId === NO_TOPIC ? undefined : values.topicoId,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="planoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("disciplinaId", "");
                  form.setValue("topicoId", undefined);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="disciplinaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disciplina</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("topicoId", undefined);
                }}
                disabled={!planoId}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma disciplina" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects
                    ?.filter((s) => !s.oculta)
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topicoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tópico</FormLabel>
              <Select
                value={field.value ?? NO_TOPIC}
                onValueChange={field.onChange}
                disabled={!disciplinaId}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um tópico" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_TOPIC}>Nenhum (registro por disciplina)</SelectItem>
                  {topics
                    ?.filter((t) => !t.oculta)
                    .map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="horas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minutos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="questoesCertas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
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
            name="questoesErradas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Erradas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
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
            name="questoesBrancas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brancas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Ex: Importado do Estudei" {...field} />
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
