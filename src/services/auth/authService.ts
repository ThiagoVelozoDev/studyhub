import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { COLLECTIONS } from "../../constants/collections";

const googleProvider = new GoogleAuthProvider();

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(nome: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: nome });
  await setDoc(doc(db, COLLECTIONS.USERS, credential.user.uid), {
    uid: credential.user.uid,
    nome,
    email,
    createdAt: serverTimestamp(),
  });
  return credential.user;
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const userDocRef = doc(db, COLLECTIONS.USERS, credential.user.uid);
  const existing = await getDoc(userDocRef);
  if (!existing.exists()) {
    await setDoc(userDocRef, {
      uid: credential.user.uid,
      nome: credential.user.displayName ?? "",
      email: credential.user.email ?? "",
      createdAt: serverTimestamp(),
    });
  }
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}
