import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";
import type { Plan, PlanSubject, PlanTopic } from "../../types";
import { listEditalSubjects, listEditalTopics } from "./editalService";

type PlanInput = Omit<Plan, "id" | "userId" | "createdAt">;

export async function listPlans(userId: string): Promise<Plan[]> {
  // Sorted client-side: an equality filter + orderBy on a different field
  // requires a Firestore composite index, which this app doesn't provision.
  const q = query(collection(db, COLLECTIONS.PLANS), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Plan)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPlan(planId: string): Promise<Plan | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.PLANS, planId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Plan) : null;
}

/**
 * Cria um plano a partir de um edital, copiando disciplinas e tópicos
 * para que o plano nunca altere o edital original (edital = template).
 */
export async function createPlanFromEdital(userId: string, input: PlanInput): Promise<string> {
  const planRef = await addDoc(collection(db, COLLECTIONS.PLANS), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
  });

  const editalSubjects = await listEditalSubjects(input.editalId, userId);
  const batch = writeBatch(db);

  for (const subject of editalSubjects) {
    const planSubjectRef = doc(collection(db, COLLECTIONS.PLAN_SUBJECTS));
    const planSubject: Omit<PlanSubject, "id"> = {
      userId,
      planoId: planRef.id,
      disciplinaOriginalId: subject.id,
      nome: subject.nome,
      cor: subject.cor,
      icone: subject.icone,
      ordem: subject.ordem,
      oculta: false,
    };
    batch.set(planSubjectRef, planSubject);

    const topics = await listEditalTopics(subject.id, userId);
    for (const topic of topics) {
      const planTopicRef = doc(collection(db, COLLECTIONS.PLAN_TOPICS));
      const planTopic: Omit<PlanTopic, "id"> = {
        userId,
        planoId: planRef.id,
        disciplinaId: planSubjectRef.id,
        topicoOriginalId: topic.id,
        nome: topic.nome,
        ordem: topic.ordem,
        concluido: false,
        percentualConclusao: 0,
        tempoEstudado: 0,
        questoesResolvidas: 0,
        oculta: false,
      };
      batch.set(planTopicRef, planTopic);
    }
  }

  await batch.commit();
  return planRef.id;
}

export async function updatePlan(planId: string, input: Partial<PlanInput>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLANS, planId), input);
}

export async function deletePlan(planId: string, userId: string): Promise<void> {
  const batch = writeBatch(db);
  const subjects = await getDocs(
    query(
      collection(db, COLLECTIONS.PLAN_SUBJECTS),
      where("planoId", "==", planId),
      where("userId", "==", userId)
    )
  );
  const topics = await getDocs(
    query(
      collection(db, COLLECTIONS.PLAN_TOPICS),
      where("planoId", "==", planId),
      where("userId", "==", userId)
    )
  );
  subjects.docs.forEach((s) => batch.delete(s.ref));
  topics.docs.forEach((t) => batch.delete(t.ref));
  batch.delete(doc(db, COLLECTIONS.PLANS, planId));
  await batch.commit();
}

// userId é exigido como filtro (além de planoId/disciplinaId) pelo mesmo motivo
// documentado em editalService.ts: o Firestore só permite a query se todo
// campo referenciado pelas regras de segurança também for um filtro de
// igualdade na própria query.
export async function listPlanSubjects(planId: string, userId: string): Promise<PlanSubject[]> {
  const q = query(
    collection(db, COLLECTIONS.PLAN_SUBJECTS),
    where("planoId", "==", planId),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PlanSubject)
    .sort((a, b) => a.ordem - b.ordem);
}

export async function listPlanTopics(
  planId: string,
  userId: string,
  disciplinaId?: string
): Promise<PlanTopic[]> {
  const constraints = disciplinaId
    ? [where("planoId", "==", planId), where("disciplinaId", "==", disciplinaId), where("userId", "==", userId)]
    : [where("planoId", "==", planId), where("userId", "==", userId)];
  const q = query(collection(db, COLLECTIONS.PLAN_TOPICS), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PlanTopic)
    .sort((a, b) => a.ordem - b.ordem);
}

export async function updatePlanTopic(
  topicId: string,
  input: Partial<Omit<PlanTopic, "id" | "planoId" | "disciplinaId">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLAN_TOPICS, topicId), input);
}

export async function deletePlanTopic(topicId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PLAN_TOPICS, topicId));
}

export async function updatePlanSubject(
  subjectId: string,
  input: Partial<Omit<PlanSubject, "id" | "planoId">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLAN_SUBJECTS, subjectId), input);
}

export async function incrementPlanTopicStudyTime(
  topicId: string,
  currentTempoEstudado: number,
  additionalMs: number
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLAN_TOPICS, topicId), {
    tempoEstudado: currentTempoEstudado + additionalMs,
    ultimaRevisao: Date.now(),
  });
}
