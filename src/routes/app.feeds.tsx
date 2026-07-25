import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useProperties } from "@/lib/property-store";
import { developmentsStore, useDevelopments } from "@/lib/developments-store";
import { lotsStore, useLots } from "@/lib/lots-store";
import {
  buildOlxFeed,
  buildZapFeed,
  buildDeveloperFeed,
  buildLandFeed,
  FEED_FORMATS_BY_VERTICAL,
  type FeedFormatId,
} from "@/lib/feed-builder";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/feeds")({
  head: () => ({
    meta: [
      { title: "Feeds XML — SquadIA" },
      { name: "description", content: "Feeds ZAP, VivaReal, OLX, Lançamentos e Lotes gerados automaticamente." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <FeedsPage />
    </AuthProvider>
  ),
});

const FORMAT_META: Record<FeedFormatId, { label: string; portals: string }> = {
  zap: { label: "ZAP / VivaReal / OLX Imóveis", portals: "ZAP, VivaReal, OLX (VRSync)" },
  olx: { label: "OLX Classificados", portals: "OLX genérico" },
  developer: { label: "VivaReal Lançamentos", portals: "VivaReal Lançamentos / Chaves na Mão" },
  land: { label: "Lotes / Loteamentos", portals: "Portais de loteamento e Google Ads" },
};

function FeedsPage() {
  const { user } = useAuth();
  const vertical = (user?.tenant?.vertical ?? "urban") as "urban" | "rural" | "developer" | "land";
  const properties = useProperties(user?.id);
  const developments = useDevelopments(user?.id);
  const lots = useLots(user?.id);

  useEffect(() => {
    if (!user) return;
    if (vertical === "developer") developmentsStore.seed(user.id);
    if (vertical === "land") lotsStore.seed(user.id);
  }, [user, vertical]);

  const available = FEED_FORMATS_BY_VERTICAL[vertical];
  const [format, setFormat] = useState<FeedFormatId>(available[0]);

  useEffect(() => {
    if (!available.includes(format)) setFormat(available[0]);
  }, [available, format]);

  const xml = useMemo(() => {
    if (!user) return "";
    const agency = { name: user.name, email: user.email };
    switch (format) {
      case "zap": return buildZapFeed(properties, agency);
      case "olx": return buildOlxFeed(properties, agency);
      case "developer": return buildDeveloperFeed(developments, agency);
      case "land": return buildLandFeed(lots, agency);
    }
  }, [format, properties, developments, lots, user]);

  const count =
    format === "developer" ? developments.reduce((s, d) => s + d.units.filter((u) => u.status === "disponivel" || u.status === "reservado").length, 0)
    : format === "land" ? lots.filter((l) => l.status === "disponivel" || l.status === "reservado").length
    : properties.length;

  function download() {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `squadia-${format}-${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyXml() {
    await navigator.clipboard.writeText(xml);
    toast.success("XML copiado");
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Feeds XML</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Formatos disponíveis para o segmento <span className="text-primary">{vertical}</span>.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {available.map((id) => {
          const f = FORMAT_META[id];
          return (
            <button
              key={id}
              onClick={() => setFormat(id)}
              className={`text-left rounded-lg border p-5 transition-colors ${
                format === id ? "border-primary bg-primary/5" : "border-border/60 bg-card/40 hover:bg-card/60"
              }`}
            >
              <div className="font-medium">{f.label}</div>
              <div className="text-xs text-muted-foreground mt-1">Compatível: {f.portals}</div>
            </button>
          );
        })}
      </div>

      <Card className="p-5 bg-card/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Preview do XML</h2>
            <p className="text-xs text-muted-foreground">
              {count} itens · gerado localmente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyXml} disabled={!xml}>Copiar</Button>
            <Button size="sm" onClick={download} disabled={!xml}>Baixar .xml</Button>
          </div>
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-md bg-background/60 border border-border/60 p-4 text-xs">
          <code>{xml.slice(0, 8000)}{xml.length > 8000 ? "\n..." : ""}</code>
        </pre>
      </Card>
    </div>
  );
}
