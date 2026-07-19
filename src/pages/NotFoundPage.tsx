import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CompassIcon } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-center">
      <CompassIcon className="size-12 text-muted-foreground" />
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço que você acessou não existe.</p>
      <Button asChild>
        <Link to="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  );
}
