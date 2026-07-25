import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { propertyStore, useProperties } from "@/lib/property-store";
import { buildOlxFeed, buildZapFeed } from "@/lib/feed-builder";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/feeds")({
  head: () => ({
    meta: [
      { title: "Feeds XML — SquadIA" },
      { name: "description", content: "Feeds ZAP, VivaReal, OLX e Chaves na Mão gerados automaticamente." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <FeedsPage />
    </AuthProvider>
  ),
});

type Format = "zap" | "olx";
const FORMATS: { id: Format; label: string; portals: string; ext: string }[] = [
  { id: "zap", label: "ZAP / VivaReal / OLX Imóveis", portals: "ZAP, VivaReal, OLX (VRSync-like)", ext: "xml" },
  { id: "olx", label: "OLX Classificados", portals: "OLX genérico", ext: "xml" },
];

function FeedsPage() {
  const { user } = useAuth();
  const properties = useProperties(user?.id);
  const [format, setFormat] = useState<Format>("zap");

  const xml = useMemo(() => {
    if (!user) return "";
    const agency = { name: user.name, email: user.email };
    return format === "zap" ? buildZapFeed(properties, agency) : buildOlxFeed(properties, agency);
  }, [format, properties, user]);

  function download() {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `squadia-${format}-${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(xml);
    toast.success("XML copiado para a área de transferência");
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Feeds XML</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publique seus {properties.length} imóveis nos principais portais.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`text-left rounded-lg border p-5 transition-colors ${
              format === f.id ? "border-primary bg-primary/5" : "border-border/60 bg-card/40 hover:bg-card/60"
            }`}
          >
            <div className="font-medium">{f.label}</div>
            <div className="text-xs text-muted-foreground mt-1">Compatível: {f.portals}</div>
          </button>
        ))}
      </div>

      <Card className="p-5 bg-card/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Preview do XML</h2>
            <p className="text-xs text-muted-foreground">
              {properties.length} imóveis · gerado localmente a partir dos seus cadastros.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} disabled={!xml}>Copiar</Button>
            <Button size="sm" onClick={download} disabled={!xml}>Baixar .xml</Button>
          </div>
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-md bg-background/60 border border-border/60 p-4 text-xs">
          <code>{xml.slice(0, 8000)}{xml.length > 8000 ? "\n..." : ""}</code>
        </pre>
        <p className="text-xs text-muted-foreground">
          Para publicar automaticamente com URL pública que os portais consomem, ative a Fase 7 (Lovable Cloud).
        </p>
      </Card>
    </div>
  );
}
