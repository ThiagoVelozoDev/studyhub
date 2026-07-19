import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as resetService from "@/services/firestore/resetService";

const RESET_QUERY_KEYS = ["plans", "planSubjects", "planTopics", "studySessions", "goals"];

export function useResetUserProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetService.resetUserProgress(user!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => RESET_QUERY_KEYS.includes(q.queryKey[0] as string),
      });
    },
  });
}
