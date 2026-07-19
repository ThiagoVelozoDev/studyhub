export type Timestamp = number;

export type EditalStatus = "ativo" | "encerrado" | "rascunho";

export interface Edital {
  id: string;
  userId: string;
  nome: string;
  orgao: string;
  cargo: string;
  banca: string;
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

export interface StudySession {
  id: string;
  userId: string;
  planoId: string;
  disciplinaId: string;
  topicoId: string;
  inicio: Timestamp;
  fim: Timestamp;
  duracao: number;
  questoesCertas?: number;
  questoesErradas?: number;
  observacoes?: string;
}

export type GoalPeriod = "diaria" | "semanal" | "mensal";

export interface Goal {
  id: string;
  userId: string;
  planoId?: string;
  periodo: GoalPeriod;
  metaMinutos: number;
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
}
