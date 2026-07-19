import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";

// Apaga todo o progresso do usuário (planos + disciplinas/tópicos de plano,
// sessões de estudo, metas), mas NUNCA os editais — usado pela "Zona de
// risco" em Configurações enquanto o app está em fase de testes.
export async function resetUserProgress(userId: string): Promise<void> {
  let batch = writeBatch(db);
  let opCount = 0;
  const commits: Promise<void>[] = [];
  function nextBatch() {
    if (opCount >= 400) {
      commits.push(batch.commit());
      batch = writeBatch(db);
      opCount = 0;
    }
    opCount++;
    return batch;
  }

  const plans = await getDocs(query(collection(db, COLLECTIONS.PLANS), where("userId", "==", userId)));
  for (const planDoc of plans.docs) {
    const subjects = await getDocs(
      query(
        collection(db, COLLECTIONS.PLAN_SUBJECTS),
        where("planoId", "==", planDoc.id),
        where("userId", "==", userId)
      )
    );
    subjects.docs.forEach((s) => nextBatch().delete(s.ref));

    const topics = await getDocs(
      query(
        collection(db, COLLECTIONS.PLAN_TOPICS),
        where("planoId", "==", planDoc.id),
        where("userId", "==", userId)
      )
    );
    topics.docs.forEach((t) => nextBatch().delete(t.ref));

    nextBatch().delete(doc(db, COLLECTIONS.PLANS, planDoc.id));
  }

  const sessions = await getDocs(
    query(collection(db, COLLECTIONS.STUDY_SESSIONS), where("userId", "==", userId))
  );
  sessions.docs.forEach((s) => nextBatch().delete(s.ref));

  const goals = await getDocs(query(collection(db, COLLECTIONS.GOALS), where("userId", "==", userId)));
  goals.docs.forEach((g) => nextBatch().delete(g.ref));

  commits.push(batch.commit());
  await Promise.all(commits);
}
