import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";
import type { UserProfile, UserRole } from "../../types";

// Única query da base sem filtro por userId — deliberado: só é alcançável
// por um admin (ver firestore.rules), para o painel de gestão de usuários.
export async function listAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return snapshot.docs
    .map((d) => d.data() as UserProfile)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), { role });
}
