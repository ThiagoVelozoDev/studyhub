import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp as FirestoreTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";
import type { Schedule, ScheduleItem } from "../../types";
import {
  computeNumeroSemanas,
  computeScheduleCapacity,
  generateScheduleItems,
} from "../../utils/scheduleGenerator";
import { sortSubjectsByPriority, type SchedulePriority } from "../../utils/subjectPriority";
import { listPlanSubjects } from "./planService";

export interface ScheduleConfig {
  minutosPorDia: number;
  questoesPorDia: number;
  diasEstudo: string[];
  materiasPorDia: number;
  modo: "todas" | "focar";
  prioridade: SchedulePriority;
}

// `createdAt` é gravado com serverTimestamp() e volta do Firestore como uma
// instância de `Timestamp` do SDK, não como `number` — mesmo o tipo `Schedule`
// declarando `createdAt: number`. Precisa ser normalizado aqui porque
// `ArchivedSchedulesList` formata esse valor com `date-fns` (que espera
// `number`/`Date`); outros usos no app só compara/ordenam, o que "funciona"
// com a instância de Timestamp por acaso (ela implementa `valueOf()`).
function toMillis(value: number | FirestoreTimestamp): number {
  return value instanceof FirestoreTimestamp ? value.toMillis() : value;
}

export async function listSchedules(planId: string, userId: string): Promise<Schedule[]> {
  const q = query(
    collection(db, COLLECTIONS.SCHEDULES),
    where("planoId", "==", planId),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return { id: d.id, ...data, createdAt: toMillis(data.createdAt) } as Schedule;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getActiveSchedule(planId: string, userId: string): Promise<Schedule | null> {
  const schedules = await listSchedules(planId, userId);
  return schedules.find((s) => s.status === "ativo") ?? null;
}

export async function listScheduleItems(
  scheduleId: string,
  userId: string
): Promise<ScheduleItem[]> {
  const q = query(
    collection(db, COLLECTIONS.SCHEDULE_ITEMS),
    where("cronogramaId", "==", scheduleId),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ScheduleItem)
    .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Cria um novo cronograma ativo para o plano, arquivando o anterior (se
 * houver) em vez de sobrescrevê-lo — permite restaurar depois.
 */
export async function createSchedule(
  userId: string,
  planId: string,
  config: ScheduleConfig
): Promise<string> {
  const subjects = (await listPlanSubjects(planId, userId)).filter((s) => !s.oculta);
  const ordered = sortSubjectsByPriority(subjects, config.prioridade);
  const capacidadeSemanal = computeScheduleCapacity(config.diasEstudo.length, config.materiasPorDia);
  const finalSubjects = config.modo === "focar" ? ordered.slice(0, capacidadeSemanal) : ordered;

  const generatedItems = generateScheduleItems({
    subjects: finalSubjects,
    diasSelecionados: config.diasEstudo,
    minutosPorDia: config.minutosPorDia,
    questoesPorDia: config.questoesPorDia,
    materiasPorDia: config.materiasPorDia,
  });
  const numeroSemanas = computeNumeroSemanas(finalSubjects.length, capacidadeSemanal);
  const previousActive = await getActiveSchedule(planId, userId);

  const batch = writeBatch(db);
  const scheduleRef = doc(collection(db, COLLECTIONS.SCHEDULES));
  const schedule: Omit<Schedule, "id" | "createdAt"> = {
    userId,
    planoId: planId,
    status: "ativo",
    minutosPorDia: config.minutosPorDia,
    questoesPorDia: config.questoesPorDia,
    materiasPorDia: config.materiasPorDia,
    diasEstudo: config.diasEstudo,
    numeroSemanas,
  };
  batch.set(scheduleRef, { ...schedule, createdAt: serverTimestamp() });

  for (const item of generatedItems) {
    const itemRef = doc(collection(db, COLLECTIONS.SCHEDULE_ITEMS));
    const scheduleItem: Omit<ScheduleItem, "id"> = {
      userId,
      cronogramaId: scheduleRef.id,
      concluido: false,
      ...item,
    };
    batch.set(itemRef, scheduleItem);
  }

  if (previousActive) {
    batch.update(doc(db, COLLECTIONS.SCHEDULES, previousActive.id), { status: "arquivado" });
  }

  await batch.commit();
  return scheduleRef.id;
}

/** Troca qual cronograma está ativo, sem regenerar itens. */
export async function restoreSchedule(
  planId: string,
  userId: string,
  scheduleId: string
): Promise<void> {
  const activeSchedule = await getActiveSchedule(planId, userId);
  const batch = writeBatch(db);
  if (activeSchedule && activeSchedule.id !== scheduleId) {
    batch.update(doc(db, COLLECTIONS.SCHEDULES, activeSchedule.id), { status: "arquivado" });
  }
  batch.update(doc(db, COLLECTIONS.SCHEDULES, scheduleId), { status: "ativo" });
  await batch.commit();
}

export async function updateScheduleItem(
  itemId: string,
  input: Partial<Pick<ScheduleItem, "concluido">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.SCHEDULE_ITEMS, itemId), input);
}
