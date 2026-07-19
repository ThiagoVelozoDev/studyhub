import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";
import type { StudySession } from "../../types";

type SessionInput = Omit<StudySession, "id" | "userId">;

export async function createStudySession(userId: string, input: SessionInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.STUDY_SESSIONS), {
    ...input,
    userId,
  });
  return ref.id;
}

export async function listStudySessions(
  userId: string,
  options?: { planoId?: string; disciplinaId?: string; topicoId?: string; max?: number }
): Promise<StudySession[]> {
  const constraints = [where("userId", "==", userId)];
  if (options?.planoId) constraints.push(where("planoId", "==", options.planoId));
  if (options?.disciplinaId) constraints.push(where("disciplinaId", "==", options.disciplinaId));
  if (options?.topicoId) constraints.push(where("topicoId", "==", options.topicoId));

  // Sorted client-side instead of via Firestore orderBy: an equality filter
  // combined with orderBy on a different field requires a composite index per
  // filter combination, and this query has several optional filters.
  const q = query(collection(db, COLLECTIONS.STUDY_SESSIONS), ...constraints);
  const snapshot = await getDocs(q);
  const sessions = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as StudySession)
    .sort((a, b) => b.inicio - a.inicio);

  return options?.max ? sessions.slice(0, options.max) : sessions;
}

export async function updateStudySession(
  sessionId: string,
  input: Partial<SessionInput>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.STUDY_SESSIONS, sessionId), input);
}

export async function deleteStudySession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.STUDY_SESSIONS, sessionId));
}
