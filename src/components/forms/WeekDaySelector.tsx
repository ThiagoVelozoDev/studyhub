import { Button } from "@/components/ui/button";
import { DIAS_SEMANA } from "@/constants/diasSemana";

interface WeekDaySelectorProps {
  value: string[];
  onChange: (dias: string[]) => void;
}

export function WeekDaySelector({ value, onChange }: WeekDaySelectorProps) {
  function toggleDia(dia: string) {
    onChange(value.includes(dia) ? value.filter((d) => d !== dia) : [...value, dia]);
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {DIAS_SEMANA.map((dia) => (
        <Button
          key={dia.value}
          type="button"
          size="sm"
          variant={value.includes(dia.value) ? "default" : "outline"}
          className="px-0 text-xs"
          onClick={() => toggleDia(dia.value)}
        >
          {dia.label}
        </Button>
      ))}
    </div>
  );
}
