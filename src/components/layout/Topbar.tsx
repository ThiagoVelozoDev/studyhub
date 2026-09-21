import { useState } from "react";
import { Menu, LogOut, User as UserIcon, Sun, Moon, Bell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useStreak } from "@/hooks/useStreak";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Topbar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { streak } = useStreak();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.displayName ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  async function handleSignOut() {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur print:hidden">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {streak > 0 && (
        <div className="hidden items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400 sm:flex">
          <Flame className="size-4" />
          Sequência: {streak} {streak === 1 ? "dia" : "dias"}
        </div>
      )}

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 text-sm">
          <p className="font-medium">Notificações</p>
          <p className="mt-1 text-muted-foreground">Você está em dia! Nenhuma notificação nova.</p>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-gradient-to-br from-[#5B5FFB] to-[#7B61FF] text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm font-medium leading-tight">
                {user?.displayName ?? user?.email}
              </span>
              <span className="text-xs leading-tight text-muted-foreground">Ver perfil</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <UserIcon className="size-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
