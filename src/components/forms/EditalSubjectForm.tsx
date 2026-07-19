import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { editalSubjectSchema, type EditalSubjectFormValues } from "@/schemas/edital.schema";
import { PRESET_COLORS } from "@/constants/colors";
import { Loader2 } from "lucide-react";

interface EditalSubjectFormProps {
  defaultValues?: Partial<EditalSubjectFormValues>;
  onSubmit: (values: EditalSubjectFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

export function EditalSubjectForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: EditalSubjectFormProps) {
  const form = useForm<EditalSubjectFormValues>({
    resolver: zodResolver(editalSubjectSchema),
    defaultValues: {
      nome: "",
      cor: PRESET_COLORS[0],
      icone: "book",
      ...defaultValues,
    },
  });

  const selectedColor = form.watch("cor");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da disciplina</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Direito Constitucional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className="size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow"
                      style={{
                        backgroundColor: color,
                        boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : "none",
                      }}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <input type="hidden" {...form.register("icone")} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
