import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";

export function MotivationalBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E2338] to-[#111827] p-4">
      <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/5">
        <Rocket className="size-8 text-[#7B61FF]" />
      </div>
      <p className="text-sm font-semibold text-white">Foco no objetivo!</p>
      <p className="mt-1 text-xs leading-relaxed text-white/60">
        Você está mais perto da aprovação do que imagina.
      </p>
      <Link
        to="/study"
        className="mt-3 block rounded-lg bg-gradient-to-r from-[#5B5FFB] to-[#7B61FF] px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
      >
        Continuar estudando
      </Link>
    </div>
  );
}
