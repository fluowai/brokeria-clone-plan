import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = { id: string; name: string; email: string; company?: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string, company?: string) => Promise<{ error?: string }>;
  signOut: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);
const STORAGE_KEY = "squadia.auth.user";
const USERS_KEY = "squadia.auth.users";

type StoredUser = User & { password: string };

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeUsers(u: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const signIn: AuthState["signIn"] = async (email, password) => {
    const users = readUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { error: "Usuário não encontrado" };
    if (found.password !== password) return { error: "Senha incorreta" };
    const { password: _p, ...safe } = found;
    persist(safe);
    return {};
  };

  const signUp: AuthState["signUp"] = async (name, email, password, company) => {
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: "Email já cadastrado" };
    }
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      company,
      password,
    };
    writeUsers([...users, newUser]);
    const { password: _p, ...safe } = newUser;
    persist(safe);
    return {};
  };

  const signOut = () => persist(null);

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
