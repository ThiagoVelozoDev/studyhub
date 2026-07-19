import { useEffect, useState } from "react";
import { usePlans } from "./usePlans";

const STORAGE_KEY = "studyhub:activePlanId";

// Mantém o plano escolhido ao navegar entre as páginas de Dashboard e
// Estatísticas, em vez de resetar a cada página (o usuário pode ter mais
// de um plano de estudo).
export function useActivePlan() {
  const { data: plans, isLoading } = usePlans();
  const [activePlanId, setActivePlanIdState] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined
  );

  useEffect(() => {
    if (!plans) return;
    const stillExists = activePlanId && plans.some((p) => p.id === activePlanId);
    if (!stillExists) {
      setActivePlanIdState(plans[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  function setActivePlanId(planId: string) {
    localStorage.setItem(STORAGE_KEY, planId);
    setActivePlanIdState(planId);
  }

  return { plans, activePlanId, setActivePlanId, isLoading };
}
