import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";
import type { Goal } from "../../types";

type GoalInput = Omit<Goal, "id" | "userId" | "createdAt">;

export async function listGoals(userId: string): Promise<Goal[]> {
  const q = query(collection(db, COLLECTIONS.GOALS), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Goal);
}

export async function createGoal(userId: string, input: GoalInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.GOALS), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGoal(goalId: string, input: Partial<GoalInput>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.GOALS, goalId), input);
}

export async function deleteGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.GOALS, goalId));
}
