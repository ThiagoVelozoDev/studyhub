import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as editalService from "@/services/firestore/editalService";
import type { Edital, EditalSubject, EditalTopic } from "@/types";
import type { ImportDisciplinaNormalized } from "@/schemas/edital.schema";

export function useEditals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editals", user?.uid],
    queryFn: () => editalService.listEditals(user!.uid),
    enabled: !!user,
  });
}

export function useEdital(editalId: string | undefined) {
  return useQuery({
    queryKey: ["edital", editalId],
    queryFn: () => editalService.getEdital(editalId!),
    enabled: !!editalId,
  });
}

export function useEditalSubjects(editalId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editalSubjects", editalId],
    queryFn: () => editalService.listEditalSubjects(editalId!, user!.uid),
    enabled: !!editalId && !!user,
  });
}

export function useEditalTopics(subjectId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editalTopics", subjectId],
    queryFn: () => editalService.listEditalTopics(subjectId!, user!.uid),
    enabled: !!subjectId && !!user,
  });
}

type EditalInput = Omit<Edital, "id" | "userId" | "createdAt" | "updatedAt">;

export function useCreateEdital() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EditalInput) => editalService.createEdital(user!.uid, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editals", user?.uid] }),
  });
}

export function useCreateEditalWithContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      editalInput,
      disciplinas,
    }: {
      editalInput: EditalInput;
      disciplinas: ImportDisciplinaNormalized[];
    }) => editalService.createEditalWithContent(user!.uid, editalInput, disciplinas),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editals", user?.uid] }),
  });
}

export function useUpdateEdital() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ editalId, input }: { editalId: string; input: Partial<EditalInput> }) =>
      editalService.updateEdital(editalId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["editals", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["edital", variables.editalId] });
    },
  });
}

export function useDeleteEdital() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (editalId: string) => editalService.deleteEdital(editalId, user!.uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editals", user?.uid] }),
  });
}

export function useCreateEditalSubject(editalId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<EditalSubject, "id" | "userId">) =>
      editalService.createEditalSubject({ ...input, userId: user!.uid }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editalSubjects", editalId] }),
  });
}

export function useUpdateEditalSubject(editalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subjectId,
      input,
    }: {
      subjectId: string;
      input: Partial<Omit<EditalSubject, "id" | "editalId">>;
    }) => editalService.updateEditalSubject(subjectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editalSubjects", editalId] }),
  });
}

export function useDeleteEditalSubject(editalId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) => editalService.deleteEditalSubject(subjectId, user!.uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editalSubjects", editalId] }),
  });
}

export function useCreateEditalTopic(subjectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<EditalTopic, "id" | "userId">) =>
      editalService.createEditalTopic({ ...input, userId: user!.uid }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editalTopics", subjectId] }),
  });
}

export function useUpdateEditalTopic(subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      topicId,
      input,
    }: {
      topicId: string;
      input: Partial<Omit<EditalTopic, "id" | "disciplinaId">>;
    }) => editalService.updateEditalTopic(topicId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editalTopics", subjectId] }),
  });
}

export function useDeleteEditalTopic(subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => editalService.deleteEditalTopic(topicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editalTopics", subjectId] }),
  });
}
