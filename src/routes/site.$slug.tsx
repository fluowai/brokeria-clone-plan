import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { findOwnerBySlug, propertyStore, type Property, PROPERTY_TYPES } from "@/lib/property-store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/site/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Imóveis` },
      { name: "description", content: `Portfólio de imóveis de ${params.slug} — apartamentos, casas e coberturas.` },
      { property: "og:title", content: `${params.slug} — Imóveis` },
      { property: "og:description", content: `Confira o portfólio de imóveis de ${params.slug}.` },
    ],
  }),
  component: TenantSite,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Corretor não encontrado</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    </div>
  ),
});

function TenantSite() {
  const { slug } = Route.useParams();
  const [owner, setOwner] = useState<{ id: string; name: string; company?: string } | null>(null);
  const [items, setItems] = useState<Property[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [purpose, setPurpose] = useState<string>("all");
  const [selected, setSelected] = useState<Property | null>(null);

  useEffect(() => {
    const o = findOwnerBySlug(slug);
    if (!o) return;
    setOwner(o);
    setItems(propertyStore.getAll().filter((p) => p.ownerId === o.id));
  }, [slug]);

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Corretor não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">O slug "{slug}" não corresponde a nenhum usuário.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
        </div>
      </div>
    );
  }

  const filtered = items.filter((p) => {
    if (type !== "all" && p.type !== type) return false;
    if (purpose !== "all" && p.purpose !== purpose) return false;
    if (q && !`${p.title} ${p.neighborhood} ${p.city}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">{owner.company || owner.name}</div>
            <div className="text-xs text-muted-foreground">Portfólio de imóveis</div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">powered by SquadIA</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Encontre seu próximo lar</h1>
        <p className="mt-2 text-muted-foreground">{items.length} imóveis disponíveis</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Buscar por bairro, cidade..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {PROPERTY_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger><SelectValue placeholder="Finalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Venda e Aluguel</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {featured.length > 0 && (
          <>
            <h2 className="mt-10 text-lg font-semibold">Destaques</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((p) => <PropertyCard key={p.id} p={p} onClick={() => setSelected(p)} />)}
            </div>
          </>
        )}
        {rest.length > 0 && (
          <>
            <h2 className="mt-10 text-lg font-semibold">Todos os imóveis</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((p) => <PropertyCard key={p.id} p={p} onClick={() => setSelected(p)} />)}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <Card className="mt-8 p-12 text-center bg-card/40 border-dashed">
            <p className="text-muted-foreground">Nenhum imóvel corresponde aos filtros.</p>
          </Card>
        )}
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="aspect-video bg-muted rounded overflow-hidden">
              {selected.images[0] ? (
                <img src={selected.images[0]} className="w-full h-full object-cover" alt={selected.title} />
              ) : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem foto</div>}
            </div>
            {selected.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {selected.images.slice(1).map((src, i) => (
                  <img key={i} src={src} className="aspect-square object-cover rounded" alt="" />
                ))}
              </div>
            )}
            <h2 className="text-2xl font-semibold">{selected.title}</h2>
            <div className="text-sm text-muted-foreground">{selected.address}, {selected.neighborhood} — {selected.city}</div>
            <div className="flex gap-6 text-sm">
              <span>{selected.bedrooms} quartos</span>
              <span>{selected.bathrooms} banheiros</span>
              <span>{selected.parking} vagas</span>
              <span>{selected.area} m²</span>
            </div>
            <div className="text-2xl font-semibold text-primary">
              {selected.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
              <span className="text-sm text-muted-foreground ml-2">/ {selected.purpose}</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.description}</p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Olá, tenho interesse no imóvel: ${selected.title}`)}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110"
            >
              Falar no WhatsApp
            </a>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function PropertyCard({ p, onClick }: { p: Property; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="overflow-hidden bg-card/60 border-border/60 hover:border-primary/40 transition cursor-pointer">
      <div className="aspect-video bg-muted">
        {p.images[0] ? (
          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
        ) : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>}
      </div>
      <div className="p-4">
        <h3 className="font-medium line-clamp-1">{p.title}</h3>
        <div className="mt-1 text-xs text-muted-foreground">{p.neighborhood}, {p.city}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-primary font-semibold">
            {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-muted-foreground">{p.bedrooms}q · {p.area}m²</span>
        </div>
      </div>
    </Card>
  );
}
