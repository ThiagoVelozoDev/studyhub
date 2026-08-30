import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as planService from "@/services/firestore/planService";
import type { Plan, PlanSubject, PlanTopic } from "@/types";

export function usePlans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["plans", user?.uid],
    queryFn: () => planService.listPlans(user!.uid),
    enabled: !!user,
  });
}

export function usePlan(planId: string | undefined) {
  return useQuery({
    queryKey: ["plan", planId],
    queryFn: () => planService.getPlan(planId!),
    enabled: !!planId,
  });
}

export function usePlanSubjects(planId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["planSubjects", planId],
    queryFn: () => planService.listPlanSubjects(planId!, user!.uid),
    enabled: !!planId && !!user,
  });
}

export function usePlanTopics(planId: string | undefined, disciplinaId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["planTopics", planId, disciplinaId ?? "all"],
    queryFn: () => planService.listPlanTopics(planId!, user!.uid, disciplinaId),
    enabled: !!planId && !!user,
  });
}

export function useAllPlanSubjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["planSubjects", "byUser", user?.uid],
    queryFn: () => planService.listAllPlanSubjectsForUser(user!.uid),
    enabled: !!user,
  });
}

export function useAllPlanTopics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["planTopics", "byUser", user?.uid],
    queryFn: () => planService.listAllPlanTopicsForUser(user!.uid),
    enabled: !!user,
  });
}

type PlanInput = Omit<Plan, "id" | "userId" | "createdAt">;

export function useCreatePlanFromEdital() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanInput) => planService.createPlanFromEdital(user!.uid, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans", user?.uid] }),
  });
}

export function useUpdatePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: Partial<PlanInput> }) =>
      planService.updatePlan(planId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plans", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["plan", variables.planId] });
    },
  });
}

export function useDeletePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => planService.deletePlan(planId, user!.uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans", user?.uid] }),
  });
}

export function useCreatePlanTopic(planId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<PlanTopic, "id" | "userId">) =>
      planService.createPlanTopic({ ...input, userId: user!.uid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planTopics", planId] });
      queryClient.invalidateQueries({ queryKey: ["planTopics", "byUser", user?.uid] });
    },
  });
}

export function useUpdatePlanTopic(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      topicId,
      input,
    }: {
      topicId: string;
      input: Partial<Omit<PlanTopic, "id" | "planoId" | "disciplinaId">>;
    }) => planService.updatePlanTopic(topicId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planTopics", planId, "all"] }),
  });
}

export function useDeletePlanTopic(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => planService.deletePlanTopic(topicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planTopics", planId, "all"] }),
  });
}

export function useUpdatePlanSubject(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subjectId,
      input,
    }: {
      subjectId: string;
      input: Partial<Omit<PlanSubject, "id" | "planoId">>;
    }) => planService.updatePlanSubject(subjectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planSubjects", planId] }),
  });
}
