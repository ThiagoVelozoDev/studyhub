import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { editalSchema, type EditalFormValues } from "@/schemas/edital.schema";
import { EDITAL_CATEGORIAS } from "@/constants/editalCategorias";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface EditalFormProps {
  defaultValues?: Partial<EditalFormValues>;
  onSubmit: (values: EditalFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

export function EditalForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: EditalFormProps) {
  const { isAdmin } = useAuth();
  const form = useForm<EditalFormValues>({
    resolver: zodResolver(editalSchema),
    defaultValues: {
      nome: "",
      orgao: "",
      cargo: "",
      banca: "",
      categoria: "",
      public: false,
      descricao: "",
      linkEdital: "",
      status: "ativo",
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
              <FormLabel>Nome do edital</FormLabel>
              <FormControl>
                <Input placeholder="Ex: TRF-1 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="orgao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Órgão</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: TRF 1ª Região" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cargo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Técnico Judiciário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carreira</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a carreira" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EDITAL_CATEGORIAS.map((categoria) => (
                    <SelectItem key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="banca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banca</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: FGV" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="linkEdital"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link do edital</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
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
                <Textarea rows={3} placeholder="Observações sobre o edital" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isAdmin && (
          <FormField
            control={form.control}
            name="public"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Visível para todos os usuários</FormLabel>
                  <FormDescription>
                    Editais públicos aparecem para qualquer usuário, que pode reaproveitá-los
                    para criar planos, mas não pode editá-los.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
