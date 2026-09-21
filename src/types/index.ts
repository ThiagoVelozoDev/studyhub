export type Timestamp = number;

export type EditalStatus = "ativo" | "encerrado" | "rascunho";

export interface Edital {
  id: string;
  userId: string;
  nome: string;
  orgao: string;
  cargo: string;
  banca: string;
  categoria: string;
  public: boolean;
  descricao?: string;
  dataPublicacao?: Timestamp;
  linkEdital?: string;
  status: EditalStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EditalSubject {
  id: string;
  userId: string;
  editalId: string;
  public: boolean;
  nome: string;
  cor: string;
  icone: string;
  ordem: number;
}

export interface EditalTopic {
  id: string;
  userId: string;
  editalId: string;
  disciplinaId: string;
  public: boolean;
  nome: string;
  descricao?: string;
  ordem: number;
  cargaHorariaSugerida?: number;
}

export interface Plan {
  id: string;
  userId: string;
  editalId: string;
  nome: string;
  descricao?: string;
  dataProva?: Timestamp;
  diasEstudo: string[];
  metaDiaria: number;
  metaSemanal: number;
  metaMensal: number;
  createdAt: Timestamp;
}

export interface PlanSubject {
  id: string;
  userId: string;
  planoId: string;
  disciplinaOriginalId: string;
  nome: string;
  cor: string;
  icone: string;
  ordem: number;
  oculta: boolean;
}

export interface PlanTopic {
  id: string;
  userId: string;
  planoId: string;
  disciplinaId: string;
  topicoOriginalId?: string;
  nome: string;
  ordem: number;
  concluido: boolean;
  percentualConclusao: number;
  tempoEstudado: number;
  questoesResolvidas: number;
  observacoes?: string;
  ultimaRevisao?: Timestamp;
  oculta: boolean;
}

export type ScheduleStatus = "ativo" | "arquivado";

export interface Schedule {
  id: string;
  userId: string;
  planoId: string;
  status: ScheduleStatus;
  minutosPorDia: number;
  questoesPorDia: number;
  materiasPorDia: number;
  diasEstudo: string[];
  numeroSemanas: number;
  createdAt: Timestamp;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  cronogramaId: string;
  semana: number;
  diaSemana: string;
  disciplinaId: string;
  ordem: number;
  minutosPlanejados: number;
  questoesPlanejadas: number;
  concluido: boolean;
}

export type SessionType = "aula" | "questoes" | "simulado";

export interface StudySession {
  id: string;
  userId: string;
  planoId: string;
  disciplinaId: string;
  topicoId?: string;
  tipo?: SessionType;
  inicio: Timestamp;
  fim: Timestamp;
  duracao: number;
  questoesCertas?: number;
  questoesErradas?: number;
  questoesBrancas?: number;
  observacoes?: string;
}

export type GoalPeriod = "diaria" | "semanal" | "mensal";

export interface Goal {
  id: string;
  userId: string;
  planoId?: string;
  periodo: GoalPeriod;
  metaMinutos: number;
  diasEstudo?: string[];
  createdAt: Timestamp;
}

export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  photoURL?: string;
  role?: UserRole;
  createdAt: Timestamp;
}
