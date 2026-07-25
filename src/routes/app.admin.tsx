import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminOverview } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — SquadIA" },
      { name: "description", content: "Painel super admin: tenants, usuários, receita." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const call = useServerFn(adminOverview);
  const isSuper = user?.roles.includes("super_admin");

  useEffect(() => {
    if (!loading && !isSuper) navigate({ to: "/app" });
  }, [loading, isSuper, navigate]);

  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => call(),
    enabled: !!isSuper,
  });

  if (!isSuper) return null;
  const data = q.data;

  return (
    <div className="p-8 space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">Super Admin</h1>
          <Badge>super_admin</Badge>
        </div>
        <p className="text-muted-foreground mt-1">Visão global de todos os tenants.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Tenants", value: data?.totals?.tenants ?? 0 },
          { label: "Usuários", value: data?.totals?.users ?? 0 },
          { label: "Leads", value: data?.totals?.leads ?? 0 },
          { label: "Imóveis", value: data?.totals?.properties ?? 0 },
          { label: "Receita", value: `R$ ${((data?.totals?.revenue_cents ?? 0) / 100).toLocaleString("pt-BR")}` },
        ].map((k) => (
          <Card key={k.label} className="p-6">
            <div className="text-xs text-muted-foreground uppercase">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/60 font-medium">Tenants</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">Imobiliária</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Usuários</th>
              <th className="p-3">Leads</th>
              <th className="p-3">Imóveis</th>
              <th className="p-3">Créditos</th>
              <th className="p-3">Criado</th>
            </tr>
          </thead>
          <tbody>
            {(data?.tenants ?? []).map((t: any) => (
              <tr key={t.id} className="border-t border-border/60">
                <td className="p-3">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">/{t.slug}</div>
                </td>
                <td className="p-3">{t.plan ?? <span className="text-muted-foreground">Trial</span>}</td>
                <td className="p-3">{t.users}</td>
                <td className="p-3">{t.leads}</td>
                <td className="p-3">{t.properties}</td>
                <td className="p-3">{t.credits}</td>
                <td className="p-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
