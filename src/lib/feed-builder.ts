import type { Property, Vertical } from "./property-store";
import type { Development } from "./developments-store";
import type { Lot } from "./lots-store";

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type Agency = { name: string; email?: string; phone?: string };

/** ZAP / VivaReal / OLX Imóveis padrão (VRSync-like). Urban + Rural. */
export function buildZapFeed(properties: Property[], agency: Agency): string {
  const now = new Date().toISOString();
  const listings = properties
    .map((p) => {
      const images = p.images
        .map((url, i) => `        <Media medium="image" primary="${i === 0 ? "true" : "false"}"><![CDATA[${url}]]></Media>`)
        .join("\n");
      const ruralBlock = p.vertical === "rural"
        ? `        <RuralArea unit="hectares">${p.areaHectares ?? 0}</RuralArea>
        <RuralActivity>${esc(p.atividade)}</RuralActivity>
        <WaterSource>${esc(p.agua)}</WaterSource>
        <CAR>${esc(p.carCode)}</CAR>
        <ITR>${esc(p.itr)}</ITR>`
        : "";
      return `    <Listing>
      <ListingID>${esc(p.id)}</ListingID>
      <Title>${esc(p.title)}</Title>
      <TransactionType>${p.purpose === "aluguel" ? "For Rent" : "For Sale"}</TransactionType>
      <PublicationType>STANDARD</PublicationType>
      <ListPrice currency="BRL">${p.price}</ListPrice>
      <Details>
        <PropertyType>${esc(p.type)}</PropertyType>
        <LivingArea unit="square metres">${p.area}</LivingArea>
        <Bedrooms>${p.bedrooms}</Bedrooms>
        <Bathrooms>${p.bathrooms}</Bathrooms>
        <Garage>${p.parking}</Garage>
${ruralBlock}
        <Description><![CDATA[${p.description}]]></Description>
      </Details>
      <Location displayAddress="Street">
        <Country abbreviation="BR">Brasil</Country>
        <City>${esc(p.city)}</City>
        <Neighborhood>${esc(p.neighborhood)}</Neighborhood>
        <Address>${esc(p.address)}</Address>
      </Location>
      <Media>
${images}
      </Media>
    </Listing>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://static.wimoveis.com.br/xsd/listings.xsd">
  <Header>
    <Provider>${esc(agency.name)}</Provider>
    <Email>${esc(agency.email)}</Email>
    <PublishDate>${now}</PublishDate>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>`;
}

/** OLX Imóveis (formato Imobiliária). */
export function buildOlxFeed(properties: Property[], agency: Agency): string {
  const items = properties
    .map((p) => {
      const images = p.images.map((u) => `      <foto><![CDATA[${u}]]></foto>`).join("\n");
      return `  <ad>
    <id>${esc(p.id)}</id>
    <categoria>${esc(p.type)}</categoria>
    <tipo>${p.purpose === "aluguel" ? "Aluguel" : "Venda"}</tipo>
    <titulo>${esc(p.title)}</titulo>
    <descricao><![CDATA[${p.description}]]></descricao>
    <preco>${p.price}</preco>
    <cidade>${esc(p.city)}</cidade>
    <bairro>${esc(p.neighborhood)}</bairro>
    <endereco>${esc(p.address)}</endereco>
    <quartos>${p.bedrooms}</quartos>
    <banheiros>${p.bathrooms}</banheiros>
    <vagas>${p.parking}</vagas>
    <area_util>${p.area}</area_util>
    <fotos>
${images}
    </fotos>
  </ad>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ads>
${items}
</ads>`;
}

/** VivaReal Lançamentos — 1 item por unidade disponível. */
export function buildDeveloperFeed(developments: Development[], agency: Agency): string {
  const now = new Date().toISOString();
  const listings = developments
    .flatMap((d) =>
      d.units
        .filter((u) => u.status === "disponivel" || u.status === "reservado")
        .map(
          (u) => `    <Listing>
      <ListingID>${esc(d.id)}-${esc(u.id)}</ListingID>
      <Title>${esc(d.name)} — Torre ${esc(u.torre)} · Unid. ${esc(u.numero)}</Title>
      <TransactionType>For Sale</TransactionType>
      <PublicationType>PREMIUM</PublicationType>
      <DevelopmentName>${esc(d.name)}</DevelopmentName>
      <DevelopmentStatus>${esc(d.status)}</DevelopmentStatus>
      <ConstructionProgress>${d.obraPercent}</ConstructionProgress>
      <DeliveryDate>${esc(d.previsaoEntrega)}</DeliveryDate>
      <ListPrice currency="BRL">${u.precoTabela}</ListPrice>
      <Details>
        <PropertyType>Unit</PropertyType>
        <LivingArea unit="square metres">${u.areaM2}</LivingArea>
        <Bedrooms>${u.bedrooms}</Bedrooms>
        <Tower>${esc(u.torre)}</Tower>
        <Floor>${u.andar}</Floor>
        <Typology>${esc(u.tipologia)}</Typology>
        <Description><![CDATA[${d.memorial ?? ""}]]></Description>
      </Details>
      <Location>
        <Country abbreviation="BR">Brasil</Country>
        <City>${esc(d.city)}</City>
        <State>${esc(d.state)}</State>
        <Address>${esc(d.standEndereco)}</Address>
      </Location>
    </Listing>`,
        ),
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed>
  <Header>
    <Provider>${esc(agency.name)}</Provider>
    <Email>${esc(agency.email)}</Email>
    <PublishDate>${now}</PublishDate>
    <FeedType>Launches</FeedType>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>`;
}

/** Feed de lotes — 1 item por lote disponível. */
export function buildLandFeed(lots: Lot[], agency: Agency): string {
  const now = new Date().toISOString();
  const listings = lots
    .filter((l) => l.status === "disponivel" || l.status === "reservado")
    .map(
      (l) => `    <Listing>
      <ListingID>${esc(l.id)}</ListingID>
      <Title>Lote ${esc(l.quadra)}-${esc(l.lote)} · ${esc(l.parcelamento)}</Title>
      <TransactionType>For Sale</TransactionType>
      <PublicationType>STANDARD</PublicationType>
      <ListPrice currency="BRL">${l.precoAvista}</ListPrice>
      <Details>
        <PropertyType>Lot</PropertyType>
        <LivingArea unit="square metres">${l.areaM2}</LivingArea>
        <LotBlock>${esc(l.quadra)}</LotBlock>
        <LotNumber>${esc(l.lote)}</LotNumber>
        <Frontage unit="metres">${l.frenteM ?? 0}</Frontage>
        <Installments>${l.parcelas ?? 0}</Installments>
        <DownPayment currency="BRL">${l.entrada ?? 0}</DownPayment>
        <Description><![CDATA[Lote ${l.quadra}-${l.lote} no ${l.parcelamento} — ${l.areaM2}m².]]></Description>
      </Details>
    </Listing>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed>
  <Header>
    <Provider>${esc(agency.name)}</Provider>
    <Email>${esc(agency.email)}</Email>
    <PublishDate>${now}</PublishDate>
    <FeedType>Lots</FeedType>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>`;
}

export type FeedFormatId = "zap" | "olx" | "developer" | "land";

export const FEED_FORMATS_BY_VERTICAL: Record<Vertical, FeedFormatId[]> = {
  urban: ["zap", "olx"],
  rural: ["zap", "olx"],
  developer: ["developer", "zap"],
  land: ["land", "olx"],
};
