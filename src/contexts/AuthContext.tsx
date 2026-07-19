import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { COLLECTIONS } from "@/constants/collections";
import type { UserProfile } from "@/types";
import {
  subscribeToAuthChanges,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  resetPassword as resetPasswordService,
} from "@/services/auth/authService";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  loginGoogle: (rememberMe: boolean) => Promise<void>;
  register: (nome: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, COLLECTIONS.USERS, user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    });
    return unsubscribe;
  }, [user]);

  async function login(email: string, password: string, rememberMe: boolean) {
    await loginWithEmail(email, password, rememberMe);
  }

  async function loginGoogle(rememberMe: boolean) {
    await loginWithGoogle(rememberMe);
  }

  async function register(nome: string, email: string, password: string) {
    await registerWithEmail(nome, email, password);
  }

  async function signOut() {
    await logout();
  }

  async function resetPassword(email: string) {
    await resetPasswordService(email);
  }

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, login, loginGoogle, register, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}
