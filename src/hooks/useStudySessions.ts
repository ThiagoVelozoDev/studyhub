import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as sessionService from "@/services/firestore/sessionService";
import * as planService from "@/services/firestore/planService";
import type { StudySession } from "@/types";

export function useStudySessions(options?: {
  planoId?: string;
  disciplinaId?: string;
  topicoId?: string;
  max?: number;
}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["studySessions", user?.uid, options ?? {}],
    queryFn: () => sessionService.listStudySessions(user!.uid, options),
    enabled: !!user,
  });
}

type SessionInput = Omit<StudySession, "id" | "userId">;

export function useCreateStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SessionInput) => {
      const sessionId = await sessionService.createStudySession(user!.uid, input);
      const topics = await planService.listPlanTopics(input.planoId, user!.uid, input.disciplinaId);
      const currentTopic = topics.find((t) => t.id === input.topicoId);
      await planService.incrementPlanTopicStudyTime(
        input.topicoId,
        currentTopic?.tempoEstudado ?? 0,
        input.duracao
      );
      return sessionId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studySessions", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["planTopics", variables.planoId, "all"] });
      queryClient.invalidateQueries({
        queryKey: ["planTopics", variables.planoId, variables.disciplinaId],
      });
    },
  });
}

export function useDeleteStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionService.deleteStudySession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["studySessions", user?.uid] }),
  });
}
