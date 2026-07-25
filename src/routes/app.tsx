import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Cockpit — SquadIA" },
      { name: "description", content: "CRM, IA e WhatsApp num só cockpit." },
      { property: "og:title", content: "Cockpit — SquadIA" },
      { property: "og:description", content: "Seu cockpit imobiliário SquadIA." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <AppShell />
      <Toaster />
    </AuthProvider>
  ),
});

function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const v = user.tenant?.vertical ?? "urban";
  const propertiesLabel =
    v === "rural" ? "Fazendas" :
    v === "developer" ? "Empreendimentos" :
    v === "land" ? "Loteamentos" : "Imóveis";
  const nav = [
    { to: "/app", label: "Dashboard" },
    { to: "/app/crm", label: "CRM" },
    { to: "/app/properties", label: propertiesLabel },
    ...(v === "developer" || v === "land" ? [{ to: "/app/contracts", label: "Contratos" }] : []),
    { to: "/app/ai", label: "Agentes IA" },
    { to: "/app/whatsapp", label: "WhatsApp" },
    { to: "/app/feeds", label: "Feeds XML" },
    { to: "/app/bi", label: "BI Cockpit" },
    { to: "/app/billing", label: "Planos & Créditos" },
    ...(user.roles?.includes("super_admin") ? [{ to: "/app/admin", label: "Super Admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-border/60 bg-card/40 backdrop-blur p-6 flex flex-col">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Squad<span className="text-primary">IA</span>
        </Link>
        <nav className="mt-8 flex-1 space-y-1">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 pt-4 text-sm">
          <div className="font-medium truncate">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={() => { signOut(); navigate({ to: "/auth" }); }}>
            Sair
          </Button>
        </div>
      </aside>
      <main className="pl-60">
        <Outlet />
      </main>
    </div>
  );
}
