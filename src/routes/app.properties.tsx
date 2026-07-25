import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { propertyStore, useProperties, PROPERTY_TYPES, TYPES_BY_VERTICAL, fileToDataURL, slugify, type Property, type PropertyType, type PropertyPurpose, type Vertical } from "@/lib/property-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/app/properties")({
  head: () => ({
    meta: [
      { title: "Imóveis — SquadIA" },
      { name: "description", content: "Cadastre e publique seus imóveis com fotos, descrição e preço." },
      { property: "og:title", content: "Imóveis — SquadIA" },
      { property: "og:description", content: "Gestão de imóveis do seu portfólio." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <PropertiesPage />
      <Toaster />
    </AuthProvider>
  ),
});

const VERTICAL_LABELS: Record<Vertical, { title: string; cta: string; defaultType: PropertyType }> = {
  urban: { title: "Imóveis", cta: "Novo imóvel", defaultType: "apartamento" },
  rural: { title: "Fazendas & Sítios", cta: "Nova propriedade rural", defaultType: "fazenda" },
  developer: { title: "Unidades do Empreendimento", cta: "Nova unidade", defaultType: "unidade" },
  land: { title: "Lotes", cta: "Novo lote", defaultType: "lote" },
};

function emptyFor(vertical: Vertical): Omit<Property, "id" | "createdAt" | "ownerId"> {
  return {
    title: "", type: VERTICAL_LABELS[vertical].defaultType, purpose: "venda", price: 0,
    address: "", city: "", neighborhood: "",
    bedrooms: vertical === "urban" || vertical === "developer" ? 1 : 0,
    bathrooms: vertical === "urban" || vertical === "developer" ? 1 : 0,
    parking: 0, area: 0,
    description: "", images: [], featured: false, vertical,
  };
}

function PropertiesPage() {
  const { user } = useAuth();
  const vertical = (user?.tenant?.vertical as Vertical) || "urban";
  useEffect(() => { if (user) propertyStore.seed(user.id); }, [user]);
  const properties = useProperties(user?.id);
  const [editing, setEditing] = useState<Property | null>(null);
  const [creating, setCreating] = useState(false);

  const siteSlug = slugify(user?.name || "");
  const labels = VERTICAL_LABELS[vertical];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{labels.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu site público:{" "}
            <a href={`/site/${siteSlug}`} target="_blank" className="text-primary hover:underline">
              /site/{siteSlug}
            </a>
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>+ {labels.cta}</Button></DialogTrigger>
          <PropertyForm vertical={vertical} initial={emptyFor(vertical)} onSubmit={(data) => {
            propertyStore.add({ ...data, ownerId: user!.id });
            toast.success("Cadastrado com sucesso");
            setCreating(false);
          }} title={labels.cta} />
        </Dialog>
      </div>


      {properties.length === 0 ? (
        <Card className="mt-8 p-12 text-center bg-card/40 border-dashed">
          <p className="text-muted-foreground">Nenhum imóvel cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Card key={p.id} className="overflow-hidden bg-card/60 border-border/60 hover:border-primary/40 transition cursor-pointer" onClick={() => setEditing(p)}>
              <div className="aspect-video bg-muted relative">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>
                )}
                {p.featured && <span className="absolute top-2 left-2 rounded bg-primary text-primary-foreground text-xs px-2 py-1">Destaque</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{p.title}</h3>
                  <span className="text-xs uppercase text-muted-foreground shrink-0">{p.purpose}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{p.neighborhood}, {p.city}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-primary font-semibold">
                    {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.bedrooms}q · {p.bathrooms}b · {p.area}m²
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <PropertyForm
            vertical={vertical}
            initial={editing}
            title="Editar"
            onDelete={() => {
              propertyStore.remove(editing.id);
              toast.success("Removido");
              setEditing(null);
            }}
            onSubmit={(data) => {
              propertyStore.update(editing.id, data);
              toast.success("Atualizado");
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function PropertyForm({
  initial, title, onSubmit, onDelete, vertical,
}: {
  initial: Omit<Property, "id" | "createdAt" | "ownerId"> | Property;
  title: string;
  vertical: Vertical;
  onSubmit: (data: Omit<Property, "id" | "createdAt" | "ownerId">) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = await Promise.all(Array.from(files).slice(0, 8).map(fileToDataURL));
    set("images", [...form.images, ...list].slice(0, 12));
  };

  const allowedTypes = TYPES_BY_VERTICAL[vertical];
  const showRooms = vertical === "urban" || vertical === "developer";
  const showRural = vertical === "rural";
  const showDev = vertical === "developer";
  const showLand = vertical === "land";

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, vertical }); }} className="space-y-3">
        <div>
          <Label>Título</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as PropertyType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.filter((t) => allowedTypes.includes(t.id)).map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Finalidade</Label>
            <Select value={form.purpose} onValueChange={(v) => set("purpose", v as PropertyPurpose)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Preço (R$)</Label>
            <Input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} required />
          </div>
          <div>
            <Label>{showRural ? "Área (m² construído)" : "Área (m²)"}</Label>
            <Input type="number" value={form.area} onChange={(e) => set("area", Number(e.target.value))} />
          </div>
        </div>

        {showRooms && (
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Quartos</Label><Input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} /></div>
            <div><Label>Banheiros</Label><Input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} /></div>
            <div><Label>Vagas</Label><Input type="number" value={form.parking} onChange={(e) => set("parking", Number(e.target.value))} /></div>
          </div>
        )}

        {showRural && (
          <div className="rounded-md border border-border/60 p-3 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Dados rurais</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Área (hectares)</Label><Input type="number" step="0.01" value={form.areaHectares ?? 0} onChange={(e) => set("areaHectares", Number(e.target.value))} /></div>
              <div><Label>Distância da cidade (km)</Label><Input type="number" step="0.1" value={form.distanciaCidadeKm ?? 0} onChange={(e) => set("distanciaCidadeKm", Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Atividade</Label>
                <Select value={form.atividade || ""} onValueChange={(v) => set("atividade", v as Property["atividade"])}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pecuaria">Pecuária</SelectItem>
                    <SelectItem value="agricola">Agrícola</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Água</Label>
                <Select value={form.agua || ""} onValueChange={(v) => set("agua", v as Property["agua"])}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acude">Açude</SelectItem>
                    <SelectItem value="rio">Rio</SelectItem>
                    <SelectItem value="poco">Poço</SelectItem>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Topografia</Label><Input value={form.topografia ?? ""} onChange={(e) => set("topografia", e.target.value)} placeholder="plano, ondulado..." /></div>
              <div className="flex items-end gap-2"><Switch id="energia" checked={!!form.energia} onCheckedChange={(v) => set("energia", v)} /><Label htmlFor="energia">Energia elétrica</Label></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>CAR</Label><Input value={form.carCode ?? ""} onChange={(e) => set("carCode", e.target.value)} /></div>
              <div><Label>Matrícula</Label><Input value={form.matricula ?? ""} onChange={(e) => set("matricula", e.target.value)} /></div>
              <div><Label>ITR</Label><Input value={form.itr ?? ""} onChange={(e) => set("itr", e.target.value)} /></div>
            </div>
          </div>
        )}

        {showDev && (
          <div className="rounded-md border border-border/60 p-3 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Empreendimento</div>
            <div><Label>Nome do empreendimento</Label><Input value={form.developmentName ?? ""} onChange={(e) => set("developmentName", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Tipologia</Label><Input value={form.tipologia ?? ""} onChange={(e) => set("tipologia", e.target.value)} placeholder="2 dorm, 65m²" /></div>
              <div><Label>Andar</Label><Input type="number" value={form.andar ?? 0} onChange={(e) => set("andar", Number(e.target.value))} /></div>
              <div><Label>Posição solar</Label><Input value={form.posicaoSolar ?? ""} onChange={(e) => set("posicaoSolar", e.target.value)} placeholder="Nascente..." /></div>
            </div>
          </div>
        )}

        {showLand && (
          <div className="rounded-md border border-border/60 p-3 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Lote</div>
            <div><Label>Loteamento</Label><Input value={form.parcelamentoName ?? ""} onChange={(e) => set("parcelamentoName", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Quadra</Label><Input value={form.quadra ?? ""} onChange={(e) => set("quadra", e.target.value)} /></div>
              <div><Label>Lote</Label><Input value={form.lote ?? ""} onChange={(e) => set("lote", e.target.value)} /></div>
              <div><Label>Frente (m)</Label><Input type="number" step="0.01" value={form.frenteM ?? 0} onChange={(e) => set("frenteM", Number(e.target.value))} /></div>
            </div>
          </div>
        )}
        <div>
          <Label>Endereço</Label>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Bairro</Label><Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></div>
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <Label>Fotos</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} />
          {form.images.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {form.images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded overflow-hidden bg-muted group">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 rounded bg-black/70 text-white text-xs px-1 opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} id="feat" />
          <Label htmlFor="feat">Destaque no site público</Label>
        </div>
        <div className="flex justify-between pt-2">
          {onDelete ? (
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>Excluir</Button>
          ) : <div />}
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </DialogContent>
  );
}
