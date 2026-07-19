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
import { PRESET_COLORS } from "../../constants/colors";
import type { Edital, EditalSubject, EditalTopic } from "../../types";
import type { ImportDisciplinaNormalized } from "../../schemas/edital.schema";

type EditalInput = Omit<Edital, "id" | "userId" | "createdAt" | "updatedAt">;

export async function listEditals(userId: string): Promise<Edital[]> {
  // Sorted client-side: an equality filter + orderBy on a different field
  // requires a Firestore composite index, which this app doesn't provision.
  const q = query(collection(db, COLLECTIONS.EDITALS), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Edital)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getEdital(editalId: string): Promise<Edital | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.EDITALS, editalId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Edital) : null;
}

// Editais públicos são visíveis a todos os usuários (ver firestore.rules) —
// só um admin pode marcar um edital como público.
export async function listPublicEditals(): Promise<Edital[]> {
  const q = query(collection(db, COLLECTIONS.EDITALS), where("public", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Edital)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createEdital(userId: string, input: EditalInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.EDITALS), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createEditalWithContent(
  userId: string,
  editalInput: EditalInput,
  disciplinas: ImportDisciplinaNormalized[]
): Promise<string> {
  const editalRef = await addDoc(collection(db, COLLECTIONS.EDITALS), {
    ...editalInput,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

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

  disciplinas.forEach((disciplina, i) => {
    const subjectRef = doc(collection(db, COLLECTIONS.EDITAL_SUBJECTS));
    nextBatch().set(subjectRef, {
      userId,
      editalId: editalRef.id,
      public: editalInput.public,
      nome: disciplina.nome,
      cor: PRESET_COLORS[i % PRESET_COLORS.length],
      icone: "book",
      ordem: i,
    });
    disciplina.topicos.forEach((topico, j) => {
      const topicRef = doc(collection(db, COLLECTIONS.EDITAL_TOPICS));
      nextBatch().set(topicRef, {
        userId,
        editalId: editalRef.id,
        disciplinaId: subjectRef.id,
        public: editalInput.public,
        ordem: j,
        ...topico,
      });
    });
  });
  commits.push(batch.commit());
  await Promise.all(commits);

  return editalRef.id;
}

export async function updateEdital(
  editalId: string,
  userId: string,
  input: Partial<EditalInput>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EDITALS, editalId), {
    ...input,
    updatedAt: serverTimestamp(),
  });

  // Se `public` mudou, propaga para as disciplinas/tópicos já existentes,
  // já que a regra de segurança deles depende do próprio campo denormalizado.
  if (input.public !== undefined) {
    const batch = writeBatch(db);
    const subjects = await getDocs(
      query(
        collection(db, COLLECTIONS.EDITAL_SUBJECTS),
        where("editalId", "==", editalId),
        where("userId", "==", userId)
      )
    );
    for (const subjectDoc of subjects.docs) {
      batch.update(subjectDoc.ref, { public: input.public });
      const topics = await getDocs(
        query(
          collection(db, COLLECTIONS.EDITAL_TOPICS),
          where("disciplinaId", "==", subjectDoc.id),
          where("userId", "==", userId)
        )
      );
      topics.docs.forEach((t) => batch.update(t.ref, { public: input.public }));
    }
    await batch.commit();
  }
}

export async function deleteEdital(editalId: string, userId: string): Promise<void> {
  const batch = writeBatch(db);
  const subjects = await getDocs(
    query(
      collection(db, COLLECTIONS.EDITAL_SUBJECTS),
      where("editalId", "==", editalId),
      where("userId", "==", userId)
    )
  );
  for (const subjectDoc of subjects.docs) {
    const topics = await getDocs(
      query(
        collection(db, COLLECTIONS.EDITAL_TOPICS),
        where("disciplinaId", "==", subjectDoc.id),
        where("userId", "==", userId)
      )
    );
    topics.docs.forEach((t) => batch.delete(t.ref));
    batch.delete(subjectDoc.ref);
  }
  batch.delete(doc(db, COLLECTIONS.EDITALS, editalId));
  await batch.commit();
}

// O userId é exigido como filtro (além de editalId/disciplinaId) porque o
// Firestore só permite uma *query* quando todo campo referenciado pelas regras
// de segurança também aparece como filtro de igualdade na própria query —
// caso contrário ele rejeita a leitura inteira com "Missing or insufficient
// permissions", mesmo que os documentos retornados pertencessem ao usuário.
export async function listEditalSubjects(
  editalId: string,
  userId: string,
  opts?: { public?: boolean }
): Promise<EditalSubject[]> {
  const q = query(
    collection(db, COLLECTIONS.EDITAL_SUBJECTS),
    where("editalId", "==", editalId),
    opts?.public ? where("public", "==", true) : where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as EditalSubject)
    .sort((a, b) => a.ordem - b.ordem);
}

export async function createEditalSubject(
  input: Omit<EditalSubject, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.EDITAL_SUBJECTS), input);
  return ref.id;
}

export async function updateEditalSubject(
  subjectId: string,
  input: Partial<Omit<EditalSubject, "id" | "editalId">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EDITAL_SUBJECTS, subjectId), input);
}

export async function deleteEditalSubject(subjectId: string, userId: string): Promise<void> {
  const batch = writeBatch(db);
  const topics = await getDocs(
    query(
      collection(db, COLLECTIONS.EDITAL_TOPICS),
      where("disciplinaId", "==", subjectId),
      where("userId", "==", userId)
    )
  );
  topics.docs.forEach((t) => batch.delete(t.ref));
  batch.delete(doc(db, COLLECTIONS.EDITAL_SUBJECTS, subjectId));
  await batch.commit();
}

export async function listEditalTopics(
  subjectId: string,
  userId: string,
  opts?: { public?: boolean }
): Promise<EditalTopic[]> {
  const q = query(
    collection(db, COLLECTIONS.EDITAL_TOPICS),
    where("disciplinaId", "==", subjectId),
    opts?.public ? where("public", "==", true) : where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as EditalTopic)
    .sort((a, b) => a.ordem - b.ordem);
}

export async function createEditalTopic(input: Omit<EditalTopic, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.EDITAL_TOPICS), input);
  return ref.id;
}

export async function updateEditalTopic(
  topicId: string,
  input: Partial<Omit<EditalTopic, "id" | "disciplinaId">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EDITAL_TOPICS, topicId), input);
}

export async function deleteEditalTopic(topicId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EDITAL_TOPICS, topicId));
}
