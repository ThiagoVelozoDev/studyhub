import { toast } from "sonner";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useAllUsers, useUpdateUserRole } from "@/hooks/useAdminUsers";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();

  async function handleToggle(uid: string, isCurrentlyAdmin: boolean) {
    try {
      await updateRole.mutateAsync({ uid, role: isCurrentlyAdmin ? "user" : "admin" });
      toast.success(isCurrentlyAdmin ? "Usuário rebaixado a estudante" : "Usuário promovido a administrador");
    } catch {
      toast.error("Não foi possível atualizar o tipo de perfil");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie quem tem acesso de administrador (pode criar editais públicos)
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && users?.length === 0 && (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" />
      )}

      {!isLoading && users && users.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Tipo de perfil</TableHead>
              <TableHead className="text-right">Administrador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isCurrentlyAdmin = u.role === "admin";
              const isSelf = u.uid === user?.uid;
              return (
                <TableRow key={u.uid}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={isCurrentlyAdmin ? "default" : "secondary"}>
                      {isCurrentlyAdmin ? "Administrador" : "Estudante"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={isCurrentlyAdmin}
                      disabled={isSelf || updateRole.isPending}
                      onCheckedChange={() => handleToggle(u.uid, isCurrentlyAdmin)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
