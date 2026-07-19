import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Plan } from "@/types";

interface PlanFilterSelectProps {
  plans: Plan[] | undefined;
  activePlanId: string | undefined;
  onChange: (planId: string) => void;
}

export function PlanFilterSelect({ plans, activePlanId, onChange }: PlanFilterSelectProps) {
  if (!plans || plans.length <= 1) return null;

  return (
    <Select value={activePlanId} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Selecione um plano" />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.id} value={plan.id}>
            {plan.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
