import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as goalService from "@/services/firestore/goalService";
import type { Goal } from "@/types";

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.uid],
    queryFn: () => goalService.listGoals(user!.uid),
    enabled: !!user,
  });
}

type GoalInput = Omit<Goal, "id" | "userId" | "createdAt">;

export function useUpsertGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, input }: { goalId?: string; input: GoalInput }) => {
      if (goalId) {
        await goalService.updateGoal(goalId, input);
        return goalId;
      }
      return goalService.createGoal(user!.uid, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals", user?.uid] }),
  });
}
