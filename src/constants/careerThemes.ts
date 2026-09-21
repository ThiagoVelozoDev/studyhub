import type { LucideIcon } from "lucide-react";
import { Building2, GraduationCap, Landmark, Scale, Shield } from "lucide-react";
import policialBanner from "@/assets/banner/policiais/banner.png";

export interface CareerTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  /** Fallback CSS quando a imagem de fundo não existe/falha ao carregar. */
  gradient: string;
  /**
   * URL da foto de fundo do hero (ver ScheduleCover). Pode ser um caminho
   * estático em /public — se o arquivo ainda não existir, cai no gradiente
   * (ver `gradient`) — ou a URL de um asset importado de `src/assets/`,
   * resolvida pelo bundler (caso do tema `policial`, já com imagem real).
   */
  backgroundImage: string;
  accent: string;
  icon: LucideIcon;
  motivationalPhrases: string[];
}

// Lista extensível (mesmo padrão de EDITAL_CATEGORIAS / BASIC_SUBJECT_KEYWORDS):
// as chaves batem exatamente com `EditalCategoria.value`. Adicionar uma
// carreira nova é só acrescentar uma entrada aqui — não exige mudança em
// `Edital`, `scheduleGenerator` nem em nenhuma outra parte do cronograma.
// Categoria sem tema cadastrado (ou vazia/desconhecida) cai em `outros`,
// ver `getCareerTheme`.
export const careerThemes: Record<string, CareerTheme> = {
  policial: {
    name: "Policial",
    colors: {
      primary: "#F5C400",
      secondary: "#111111",
      background: "#080808",
      surface: "#151515",
      text: "#FFFFFF",
      muted: "#9A9A9A",
    },
    gradient: "linear-gradient(135deg, #151515 0%, #080808 60%, #000000 100%)",
    backgroundImage: policialBanner,
    accent: "#F5C400",
    icon: Shield,
    motivationalPhrases: [
      "Disciplina separa os que sonham dos que conquistam.",
      "A aprovação começa na rotina — treine hoje como quem já usa o distintivo.",
      "Foco na missão: cada questão resolvida é um passo até a corporação.",
    ],
  },
  tribunais: {
    name: "Tribunais",
    colors: {
      primary: "#C9A24B",
      secondary: "#0B1D3A",
      background: "#0A1220",
      surface: "#101B30",
      text: "#F5F1E6",
      muted: "#A9B4C4",
    },
    gradient: "linear-gradient(135deg, #101B30 0%, #0A1220 60%, #060B14 100%)",
    backgroundImage: "/images/careers/tribunais.webp",
    accent: "#C9A24B",
    icon: Scale,
    motivationalPhrases: [
      "Justiça se constrói com estudo: hoje é mais um argumento a seu favor.",
      "Cada edital vencido é um passo até a posse.",
      "Persistência é a sua melhor sentença — continue.",
    ],
  },
  fiscal: {
    name: "Fiscal/Receita",
    colors: {
      primary: "#2ECC8F",
      secondary: "#0B3B2C",
      background: "#07120F",
      surface: "#0E1E19",
      text: "#F2FAF6",
      muted: "#9FC4B4",
    },
    gradient: "linear-gradient(135deg, #0E1E19 0%, #07120F 60%, #030907 100%)",
    backgroundImage: "/images/careers/fiscal.webp",
    accent: "#2ECC8F",
    icon: Landmark,
    motivationalPhrases: [
      "Números não mentem: quanto mais estudo, mais perto do cargo.",
      "Cada questão resolvida é capital acumulado para a prova.",
      "Auditoria começa em casa — audite seu próprio progresso hoje.",
    ],
  },
  administrativo: {
    name: "Administrativo/Federal",
    colors: {
      primary: "#4C8DFF",
      secondary: "#0E2A52",
      background: "#081428",
      surface: "#0F2140",
      text: "#F3F6FC",
      muted: "#9FB3D1",
    },
    gradient: "linear-gradient(135deg, #0F2140 0%, #081428 60%, #030A16 100%)",
    backgroundImage: "/images/careers/administrativo.webp",
    accent: "#4C8DFF",
    icon: Building2,
    motivationalPhrases: [
      "Organização hoje, estabilidade amanhã — continue o processo.",
      "Cada meta cumprida é um protocolo a mais em direção à posse.",
      "Eficiência é rotina: mantenha o ritmo de estudo.",
    ],
  },
  outros: {
    name: "Concurso Público",
    colors: {
      primary: "#8C8FFF",
      secondary: "#1E1B3A",
      background: "#0C0A1A",
      surface: "#141230",
      text: "#F5F4FF",
      muted: "#A8A4CC",
    },
    gradient: "linear-gradient(135deg, #141230 0%, #0C0A1A 60%, #05040D 100%)",
    backgroundImage: "/images/careers/outros.webp",
    accent: "#8C8FFF",
    icon: GraduationCap,
    motivationalPhrases: [
      "Todo grande resultado começa com um pequeno hábito diário.",
      "Sua aprovação é construída um dia de estudo de cada vez.",
      "Continue — o edital não espera, mas você está se preparando.",
    ],
  },
};

export function getCareerTheme(categoria: string | null | undefined): CareerTheme {
  if (!categoria) return careerThemes.outros;
  return careerThemes[categoria] ?? careerThemes.outros;
}
