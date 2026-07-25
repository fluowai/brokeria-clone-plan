import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — SquadIA" },
      { name: "description", content: "Acesse seu cockpit SquadIA: CRM, IA e WhatsApp em um só lugar." },
      { property: "og:title", content: "Entrar — SquadIA" },
      { property: "og:description", content: "Acesse seu cockpit SquadIA." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <AuthPage />
      <Toaster />
    </AuthProvider>
  ),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(name, email, password, company);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(mode === "signin" ? "Bem-vindo de volta!" : "Conta criada!");
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block mb-8 text-sm text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <Card className="p-8 bg-card/60 border-border/60 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Entrar no SquadIA" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Acesse seu cockpit" : "Comece o trial de 7 dias"}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="company">Imobiliária</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Sem conta?{" "}
                <button className="text-primary hover:underline" onClick={() => setMode("signup")}>
                  Criar agora
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button className="text-primary hover:underline" onClick={() => setMode("signin")}>
                  Entrar
                </button>
              </>
            )}
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Dados armazenados localmente no seu navegador (modo demo).
        </p>
      </div>
    </div>
  );
}
