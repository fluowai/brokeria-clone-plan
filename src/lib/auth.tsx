import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { me, signIn as signInFn, signUp as signUpFn, signOut as signOutFn } from "./auth.functions";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; name: string; agency: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const meCall = useServerFn(me);
  const signInCall = useServerFn(signInFn);
  const signUpCall = useServerFn(signUpFn);
  const signOutCall = useServerFn(signOutFn);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const r = await meCall();
        return r.user as AuthUser;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
  });

  const value: AuthCtx = {
    user: q.data ?? null,
    loading: q.isLoading,
    async signIn(email, password) {
      await signInCall({ data: { email, password } });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    async signUp(input) {
      await signUpCall({ data: input });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    async signOut() {
      await signOutCall({});
      await qc.invalidateQueries({ queryKey: ["me"] });
      qc.clear();
    },
  };

  useEffect(() => {
    // No-op; kept for parity with old provider
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
