import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as scheduleService from "@/services/firestore/scheduleService";
import type { ScheduleConfig } from "@/services/firestore/scheduleService";

export function useSchedules(planId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["schedules", planId],
    queryFn: () => scheduleService.listSchedules(planId!, user!.uid),
    enabled: !!planId && !!user,
  });
}

export function useScheduleItems(scheduleId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scheduleItems", scheduleId],
    queryFn: () => scheduleService.listScheduleItems(scheduleId!, user!.uid),
    enabled: !!scheduleId && !!user,
  });
}

export function useCreateSchedule(planId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: ScheduleConfig) => scheduleService.createSchedule(user!.uid, planId!, config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules", planId] }),
  });
}

export function useRestoreSchedule(planId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => scheduleService.restoreSchedule(planId!, user!.uid, scheduleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules", planId] }),
  });
}

export function useUpdateScheduleItem(scheduleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, concluido }: { itemId: string; concluido: boolean }) =>
      scheduleService.updateScheduleItem(itemId, { concluido }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scheduleItems", scheduleId] }),
  });
}
