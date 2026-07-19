import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, Sun, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useGoals, useUpsertGoal } from "@/hooks/useGoals";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: goals } = useGoals();
  const upsertGoal = useUpsertGoal();
  const navigate = useNavigate();

  const diariaGoal = goals?.find((g) => g.periodo === "diaria");
  const semanalGoal = goals?.find((g) => g.periodo === "semanal");
  const mensalGoal = goals?.find((g) => g.periodo === "mensal");

  const [diaria, setDiaria] = useState("60");
  const [semanal, setSemanal] = useState("300");
  const [mensal, setMensal] = useState("1200");

  useEffect(() => {
    if (diariaGoal) setDiaria(String(diariaGoal.metaMinutos));
    if (semanalGoal) setSemanal(String(semanalGoal.metaMinutos));
    if (mensalGoal) setMensal(String(mensalGoal.metaMinutos));
  }, [diariaGoal, semanalGoal, mensalGoal]);

  async function saveGoals() {
    try {
      await Promise.all([
        upsertGoal.mutateAsync({
          goalId: diariaGoal?.id,
          input: { periodo: "diaria", metaMinutos: Number(diaria) },
        }),
        upsertGoal.mutateAsync({
          goalId: semanalGoal?.id,
          input: { periodo: "semanal", metaMinutos: Number(semanal) },
        }),
        upsertGoal.mutateAsync({
          goalId: mensalGoal?.id,
          input: { periodo: "mensal", metaMinutos: Number(mensal) },
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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Diária (min)</Label>
              <Input type="number" min={0} value={diaria} onChange={(e) => setDiaria(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Semanal (min)</Label>
              <Input type="number" min={0} value={semanal} onChange={(e) => setSemanal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mensal (min)</Label>
              <Input type="number" min={0} value={mensal} onChange={(e) => setMensal(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveGoals} disabled={upsertGoal.isPending}>
            Salvar metas
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" onClick={handleSignOut}>
        <LogOut className="size-4" />
        Sair da conta
      </Button>
    </div>
  );
}
