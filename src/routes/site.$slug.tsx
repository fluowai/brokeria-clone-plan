import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { findOwnerBySlug, propertyStore, type Property, PROPERTY_TYPES, type Vertical } from "@/lib/property-store";
import { developmentsStore, type Development, UNIT_STATUS_META } from "@/lib/developments-store";
import { lotsStore, type Lot, STATUS_META } from "@/lib/lots-store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/site/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Portfólio SquadIA` },
      { name: "description", content: `Portfólio digital de ${params.slug} — imóveis, empreendimentos, lotes e fazendas.` },
      { property: "og:title", content: `${params.slug} — Portfólio` },
      { property: "og:description", content: `Confira o portfólio de ${params.slug}.` },
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

function inferVertical(ownerId: string, props: Property[]): Vertical {
  if (lotsStore.getAll().some((l) => l.ownerId === ownerId)) return "land";
  if (developmentsStore.getAll().some((d) => d.ownerId === ownerId)) return "developer";
  if (props.some((p) => p.vertical === "rural" || ["fazenda", "sitio", "chacara"].includes(p.type))) return "rural";
  return props.some((p) => p.vertical) ? (props.find((p) => p.vertical)!.vertical as Vertical) : "urban";
}

const VERTICAL_COPY: Record<Vertical, { title: string; subtitle: (n: number) => string }> = {
  urban: { title: "Encontre seu próximo lar", subtitle: (n) => `${n} imóveis disponíveis` },
  rural: { title: "Fazendas, sítios e chácaras", subtitle: (n) => `${n} propriedades rurais` },
  developer: { title: "Lançamentos e obras em andamento", subtitle: (n) => `${n} empreendimentos` },
  land: { title: "Lotes à venda", subtitle: (n) => `${n} lotes disponíveis no mapa` },
};

function TenantSite() {
  const { slug } = Route.useParams();
  const [owner, setOwner] = useState<{ id: string; name: string; company?: string } | null>(null);
  const [items, setItems] = useState<Property[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [vertical, setVertical] = useState<Vertical>("urban");

  useEffect(() => {
    const o = findOwnerBySlug(slug);
    if (!o) return;
    setOwner(o);
    const props = propertyStore.getAll().filter((p) => p.ownerId === o.id);
    setItems(props);
    setDevelopments(developmentsStore.getAll().filter((d) => d.ownerId === o.id));
    setLots(lotsStore.getAll().filter((l) => l.ownerId === o.id));
    setVertical(inferVertical(o.id, props));
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

  const count = vertical === "developer" ? developments.length : vertical === "land" ? lots.filter((l) => l.status === "disponivel").length : items.length;
  const copy = VERTICAL_COPY[vertical];
  const waLink = (msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">{owner.company || owner.name}</div>
            <div className="text-xs text-muted-foreground capitalize">Portfólio · {vertical}</div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">powered by SquadIA</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-muted-foreground">{copy.subtitle(count)}</p>

        {vertical === "urban" && <UrbanPortfolio items={items} waLink={waLink} />}
        {vertical === "rural" && <RuralPortfolio items={items} waLink={waLink} />}
        {vertical === "developer" && <DeveloperPortfolio developments={developments} waLink={waLink} />}
        {vertical === "land" && <LandPortfolio lots={lots} waLink={waLink} />}
      </section>
    </div>
  );
}

/* ---------- URBAN ---------- */
function UrbanPortfolio({ items, waLink }: { items: Property[]; waLink: (m: string) => string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [purpose, setPurpose] = useState("all");
  const [selected, setSelected] = useState<Property | null>(null);

  const filtered = items.filter((p) => {
    if (type !== "all" && p.type !== type) return false;
    if (purpose !== "all" && p.purpose !== purpose) return false;
    if (q && !`${p.title} ${p.neighborhood} ${p.city}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input placeholder="Buscar por bairro, cidade..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {PROPERTY_TYPES.filter((t) => !["fazenda","sitio","chacara","unidade","lote"].includes(t.id)).map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => <PropertyCard key={p.id} p={p} onClick={() => setSelected(p)} />)}
      </div>
      {filtered.length === 0 && (
        <Card className="mt-8 p-12 text-center bg-card/40 border-dashed">
          <p className="text-muted-foreground">Nenhum imóvel corresponde aos filtros.</p>
        </Card>
      )}

      <PropertyDialog p={selected} onClose={() => setSelected(null)} waLink={waLink} />
    </>
  );
}

/* ---------- RURAL ---------- */
function RuralPortfolio({ items, waLink }: { items: Property[]; waLink: (m: string) => string }) {
  const [atividade, setAtividade] = useState("all");
  const [selected, setSelected] = useState<Property | null>(null);
  const filtered = items.filter((p) => atividade === "all" || p.atividade === atividade);

  return (
    <>
      <div className="mt-6">
        <Select value={atividade} onValueChange={setAtividade}>
          <SelectTrigger className="max-w-xs"><SelectValue placeholder="Atividade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as atividades</SelectItem>
            <SelectItem value="pecuaria">Pecuária</SelectItem>
            <SelectItem value="agricola">Agrícola</SelectItem>
            <SelectItem value="misto">Misto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} onClick={() => setSelected(p)} className="overflow-hidden bg-card/60 hover:border-primary/40 cursor-pointer transition">
            <div className="aspect-video bg-muted">
              {p.images[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>}
            </div>
            <div className="p-4">
              <h3 className="font-medium">{p.title}</h3>
              <div className="mt-1 text-xs text-muted-foreground">{p.city} · {p.atividade || "—"}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-primary font-semibold">{brl(p.price)}</span>
                <span className="text-xs text-muted-foreground">{p.areaHectares ?? 0} ha</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card className="mt-8 p-12 text-center bg-card/40 border-dashed">
          <p className="text-muted-foreground">Nenhuma propriedade cadastrada.</p>
        </Card>
      )}
      <PropertyDialog p={selected} onClose={() => setSelected(null)} waLink={waLink} rural />
    </>
  );
}

/* ---------- DEVELOPER ---------- */
function DeveloperPortfolio({ developments, waLink }: { developments: Development[]; waLink: (m: string) => string }) {
  const [selected, setSelected] = useState<Development | null>(null);

  return (
    <>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {developments.map((d) => {
          const disponivel = d.units.filter((u) => u.status === "disponivel").length;
          return (
            <Card key={d.id} onClick={() => setSelected(d)} className="overflow-hidden bg-card/60 hover:border-primary/40 cursor-pointer transition">
              <div className="aspect-video bg-muted">
                {d.coverUrl ? <img src={d.coverUrl} alt={d.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{d.name}</h3>
                  <span className="text-xs text-muted-foreground capitalize">{d.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">{d.city} · {d.torres} torres · entrega {d.previsaoEntrega ?? "—"}</div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${d.obraPercent}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">Obra {d.obraPercent}% · {disponivel} unidades disponíveis</div>
              </div>
            </Card>
          );
        })}
      </div>
      {developments.length === 0 && (
        <Card className="mt-8 p-12 text-center bg-card/40 border-dashed">
          <p className="text-muted-foreground">Nenhum empreendimento cadastrado.</p>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold">{selected.name}</h2>
            <div className="text-sm text-muted-foreground">{selected.city} · {selected.torres} torres · entrega {selected.previsaoEntrega ?? "—"}</div>
            <p className="text-sm text-muted-foreground">{selected.memorial}</p>
            <div className="space-y-4">
              {Array.from(new Set(selected.units.map((u) => u.torre))).map((torre) => (
                <div key={torre}>
                  <div className="text-sm font-medium mb-1">Torre {torre}</div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
                    {selected.units.filter((u) => u.torre === torre).map((u) => {
                      const m = UNIT_STATUS_META[u.status];
                      return (
                        <div key={u.id} className={`aspect-square rounded border ${m.bg} flex items-center justify-center text-[10px] font-medium`} title={`${u.numero} · ${m.label} · ${brl(u.precoTabela)}`}>
                          {u.numero}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {Object.entries(UNIT_STATUS_META).map(([k, m]) => (
                <span key={k} className="flex items-center gap-1"><span className={`inline-block w-3 h-3 rounded ${m.bg}`} /> {m.label}</span>
              ))}
            </div>
            <a href={waLink(`Olá, quero informações do empreendimento ${selected.name}`)} target="_blank" className="inline-flex mt-2 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110">
              Falar no WhatsApp
            </a>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

/* ---------- LAND ---------- */
function LandPortfolio({ lots, waLink }: { lots: Lot[]; waLink: (m: string) => string }) {
  const [quadra, setQuadra] = useState("all");
  const [selected, setSelected] = useState<Lot | null>(null);
  const quadras = useMemo(() => Array.from(new Set(lots.map((l) => l.quadra))).sort(), [lots]);
  const filtered = lots.filter((l) => quadra === "all" || l.quadra === quadra);
  const grouped = useMemo(() => {
    const g: Record<string, Lot[]> = {};
    filtered.forEach((l) => { (g[l.quadra] ||= []).push(l); });
    Object.values(g).forEach((arr) => arr.sort((a, b) => a.lote.localeCompare(b.lote)));
    return g;
  }, [filtered]);

  return (
    <>
      <div className="mt-6">
        <Select value={quadra} onValueChange={setQuadra}>
          <SelectTrigger className="max-w-xs"><SelectValue placeholder="Quadra" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as quadras</SelectItem>
            {quadras.map((q) => <SelectItem key={q} value={q}>Quadra {q}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-4">
        {Object.entries(grouped).map(([q, arr]) => (
          <Card key={q} className="p-4 bg-card/60">
            <div className="text-sm font-medium mb-3">Quadra {q}</div>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
              {arr.map((l) => {
                const m = STATUS_META[l.status];
                const clickable = l.status === "disponivel";
                return (
                  <button
                    key={l.id}
                    disabled={!clickable}
                    onClick={() => setSelected(l)}
                    className={`aspect-square rounded border ${m.bg} flex items-center justify-center text-[10px] font-medium transition ${clickable ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                    title={`Lote ${l.quadra}-${l.lote} · ${m.label} · ${brl(l.precoAvista)}`}
                  >
                    {l.lote}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-12 text-center bg-card/40 border-dashed">
            <p className="text-muted-foreground">Nenhum lote cadastrado.</p>
          </Card>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {Object.entries(STATUS_META).map(([k, m]) => (
            <span key={k} className="flex items-center gap-1"><span className={`inline-block w-3 h-3 rounded ${m.bg}`} /> {m.label}</span>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-md">
            <h2 className="text-2xl font-semibold">Lote {selected.quadra}-{selected.lote}</h2>
            <div className="text-sm text-muted-foreground">{selected.parcelamento}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><div className="text-xs text-muted-foreground">Área</div>{selected.areaM2} m²</div>
              <div><div className="text-xs text-muted-foreground">Frente</div>{selected.frenteM ?? "—"} m</div>
              <div><div className="text-xs text-muted-foreground">À vista</div>{brl(selected.precoAvista)}</div>
              <div><div className="text-xs text-muted-foreground">Parcelado</div>{selected.parcelas ? `${selected.parcelas}x` : "—"}</div>
            </div>
            <a href={waLink(`Quero reservar o lote ${selected.quadra}-${selected.lote} no ${selected.parcelamento}`)} target="_blank" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110">
              Reservar via WhatsApp
            </a>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

/* ---------- SHARED ---------- */
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function PropertyCard({ p, onClick }: { p: Property; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="overflow-hidden bg-card/60 border-border/60 hover:border-primary/40 transition cursor-pointer">
      <div className="aspect-video bg-muted">
        {p.images[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>}
      </div>
      <div className="p-4">
        <h3 className="font-medium line-clamp-1">{p.title}</h3>
        <div className="mt-1 text-xs text-muted-foreground">{p.neighborhood}, {p.city}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-primary font-semibold">{brl(p.price)}</span>
          <span className="text-xs text-muted-foreground">{p.bedrooms}q · {p.area}m²</span>
        </div>
      </div>
    </Card>
  );
}

function PropertyDialog({ p, onClose, waLink, rural }: { p: Property | null; onClose: () => void; waLink: (m: string) => string; rural?: boolean }) {
  return (
    <Dialog open={!!p} onOpenChange={(o) => !o && onClose()}>
      {p && (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="aspect-video bg-muted rounded overflow-hidden">
            {p.images[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt={p.title} /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem foto</div>}
          </div>
          <h2 className="text-2xl font-semibold">{p.title}</h2>
          <div className="text-sm text-muted-foreground">{p.address}, {p.neighborhood} — {p.city}</div>
          {rural ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><div className="text-xs text-muted-foreground">Área</div>{p.areaHectares ?? 0} ha</div>
              <div><div className="text-xs text-muted-foreground">Atividade</div>{p.atividade || "—"}</div>
              <div><div className="text-xs text-muted-foreground">Água</div>{p.agua || "—"}</div>
              <div><div className="text-xs text-muted-foreground">CAR</div>{p.carCode || "—"}</div>
            </div>
          ) : (
            <div className="flex gap-6 text-sm">
              <span>{p.bedrooms} quartos</span>
              <span>{p.bathrooms} banheiros</span>
              <span>{p.parking} vagas</span>
              <span>{p.area} m²</span>
            </div>
          )}
          <div className="text-2xl font-semibold text-primary">
            {brl(p.price)}<span className="text-sm text-muted-foreground ml-2">/ {p.purpose}</span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{p.description}</p>
          <a href={waLink(`Olá, tenho interesse: ${p.title}`)} target="_blank" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110">
            Falar no WhatsApp
          </a>
        </DialogContent>
      )}
    </Dialog>
  );
}
