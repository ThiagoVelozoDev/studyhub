import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, Sun, LogOut, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudyGoalsFields } from "@/components/forms/StudyGoalsFields";
import { DIAS_ESTUDO_PADRAO } from "@/constants/diasSemana";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useGoals, useUpsertGoal } from "@/hooks/useGoals";
import { useResetUserProgress } from "@/hooks/useResetUserData";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: goals } = useGoals();
  const upsertGoal = useUpsertGoal();
  const resetProgress = useResetUserProgress();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const navigate = useNavigate();

  const diariaGoal = goals?.find((g) => g.periodo === "diaria");
  const semanalGoal = goals?.find((g) => g.periodo === "semanal");
  const mensalGoal = goals?.find((g) => g.periodo === "mensal");

  const [diaria, setDiaria] = useState(60);
  const [semanal, setSemanal] = useState(300);
  const [mensal, setMensal] = useState(1200);
  const [diasEstudo, setDiasEstudo] = useState<string[]>(DIAS_ESTUDO_PADRAO);

  useEffect(() => {
    if (diariaGoal) setDiaria(diariaGoal.metaMinutos);
    if (semanalGoal) setSemanal(semanalGoal.metaMinutos);
    if (mensalGoal) setMensal(mensalGoal.metaMinutos);
    if (diariaGoal?.diasEstudo) setDiasEstudo(diariaGoal.diasEstudo);
  }, [diariaGoal, semanalGoal, mensalGoal]);

  async function saveGoals() {
    try {
      await Promise.all([
        upsertGoal.mutateAsync({
          goalId: diariaGoal?.id,
          input: { periodo: "diaria", metaMinutos: diaria, diasEstudo },
        }),
        upsertGoal.mutateAsync({
          goalId: semanalGoal?.id,
          input: { periodo: "semanal", metaMinutos: semanal },
        }),
        upsertGoal.mutateAsync({
          goalId: mensalGoal?.id,
          input: { periodo: "mensal", metaMinutos: mensal },
        }),
      ]);
      toast.success("Metas atualizadas");
    } catch {
      toast.error("Não foi possível salvar as metas");
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  async function handleResetProgress() {
    try {
      await resetProgress.mutateAsync();
      toast.success("Seus dados de progresso foram zerados");
      navigate("/dashboard");
    } catch {
      toast.error("Não foi possível zerar os dados");
    } finally {
      setResetDialogOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências da conta e do aplicativo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={user?.displayName ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span className="text-sm">Modo escuro</span>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metas de estudo</CardTitle>
          <CardDescription>Usadas como padrão no dashboard quando o plano não define metas próprias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StudyGoalsFields
            metaDiaria={diaria}
            onMetaDiariaChange={setDiaria}
            metaSemanal={semanal}
            onMetaSemanalChange={setSemanal}
            metaMensal={mensal}
            onMetaMensalChange={setMensal}
            diasEstudo={diasEstudo}
            onDiasEstudoChange={setDiasEstudo}
          />
          <Button onClick={saveGoals} disabled={upsertGoal.isPending}>
            Salvar metas
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            Zona de risco
          </CardTitle>
          <CardDescription>
            Apaga todos os seus planos, disciplinas/tópicos de plano, sessões de estudo e metas.
            Seus editais não são afetados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setResetDialogOpen(true)}>
            Zerar meus dados
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" onClick={handleSignOut}>
        <LogOut className="size-4" />
        Sair da conta
      </Button>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar todos os seus dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apaga permanentemente todos os seus planos, disciplinas/tópicos de plano,
              sessões de estudo e metas. Seus editais não serão afetados. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetProgress} disabled={resetProgress.isPending}>
              Zerar meus dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
