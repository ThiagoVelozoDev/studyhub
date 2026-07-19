import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_SEMANA } from "@/constants/diasSemana";
import { cn } from "@/utils/cn";

type Unidade = "min" | "horas";

interface StudyGoalsFieldsProps {
  metaDiaria: number;
  onMetaDiariaChange: (minutos: number) => void;
  metaSemanal: number;
  onMetaSemanalChange: (minutos: number) => void;
  metaMensal: number;
  onMetaMensalChange: (minutos: number) => void;
  diasEstudo: string[];
  onDiasEstudoChange: (dias: string[]) => void;
}

// Semanal/mensal se recalculam automaticamente a partir da diária × dias
// selecionados sempre que um dos dois mudar, mas continuam editáveis
// manualmente depois (o próximo ajuste de dia/diária recalcula de novo).
export function StudyGoalsFields({
  metaDiaria,
  onMetaDiariaChange,
  metaSemanal,
  onMetaSemanalChange,
  metaMensal,
  onMetaMensalChange,
  diasEstudo,
  onDiasEstudoChange,
}: StudyGoalsFieldsProps) {
  const [unidade, setUnidade] = useState<Unidade>("min");
  const lastTrigger = useRef<string>("");

  useEffect(() => {
    const key = `${metaDiaria}|${diasEstudo.join(",")}`;
    if (lastTrigger.current === key) return;
    lastTrigger.current = key;
    onMetaSemanalChange(metaDiaria * diasEstudo.length);
    onMetaMensalChange(metaDiaria * diasEstudo.length * 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaDiaria, diasEstudo]);

  function toggleDia(value: string) {
    onDiasEstudoChange(
      diasEstudo.includes(value) ? diasEstudo.filter((d) => d !== value) : [...diasEstudo, value]
    );
  }

  const diariaDisplay = unidade === "horas" ? metaDiaria / 60 : metaDiaria;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Meta diária</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={unidade === "min" ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              onClick={() => setUnidade("min")}
            >
              Minutos
            </Button>
            <Button
              type="button"
              size="sm"
              variant={unidade === "horas" ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              onClick={() => setUnidade("horas")}
            >
              Horas
            </Button>
          </div>
        </div>
        <Input
          type="number"
          min={0}
          step={unidade === "horas" ? 0.5 : 1}
          value={diariaDisplay}
          onChange={(e) => {
            const value = Number(e.target.value);
            onMetaDiariaChange(unidade === "horas" ? Math.round(value * 60) : value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Dias que vai estudar</Label>
        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((dia) => (
            <Button
              key={dia.value}
              type="button"
              size="sm"
              variant={diasEstudo.includes(dia.value) ? "default" : "outline"}
              className={cn("px-0 text-xs")}
              onClick={() => toggleDia(dia.value)}
            >
              {dia.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Meta semanal (min)</Label>
          <Input
            type="number"
            min={0}
            value={metaSemanal}
            onChange={(e) => onMetaSemanalChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Meta mensal (min)</Label>
          <Input
            type="number"
            min={0}
            value={metaMensal}
            onChange={(e) => onMetaMensalChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
