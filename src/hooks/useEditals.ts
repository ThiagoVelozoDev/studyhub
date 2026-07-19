import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as editalService from "@/services/firestore/editalService";
import type { Edital, EditalSubject, EditalTopic } from "@/types";
import type { ImportDisciplinaNormalized } from "@/schemas/edital.schema";

export function useEditals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editals", user?.uid],
    queryFn: async () => {
      const own = await editalService.listEditals(user!.uid);
      // Se as firestore.rules publicadas ainda forem as antigas (sem suporte
      // a `public`), essa query é rejeitada — cai para só os editais
      // próprios em vez de quebrar a página inteira.
      const public_ = await editalService.listPublicEditals().catch(() => []);
      const ownIds = new Set(own.map((e) => e.id));
      const merged = [...own, ...public_.filter((e) => !ownIds.has(e.id))];
      return merged.sort((a, b) => b.createdAt - a.createdAt);
    },
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

export function useEditalSubjects(editalId: string | undefined, opts?: { public?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editalSubjects", editalId, opts?.public ?? false],
    queryFn: () => editalService.listEditalSubjects(editalId!, user!.uid, opts),
    enabled: !!editalId && !!user,
  });
}

export function useEditalTopics(subjectId: string | undefined, opts?: { public?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editalTopics", subjectId, opts?.public ?? false],
    queryFn: () => editalService.listEditalTopics(subjectId!, user!.uid, opts),
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
      editalService.updateEdital(editalId, user!.uid, input),
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
