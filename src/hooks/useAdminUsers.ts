import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as userService from "@/services/firestore/userService";
import type { UserRole } from "@/types";

export function useAllUsers() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: () => userService.listAllUsers(),
    enabled: isAdmin,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: UserRole }) =>
      userService.updateUserRole(uid, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "all"] }),
  });
}
