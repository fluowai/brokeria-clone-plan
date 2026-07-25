import type { Property } from "./property-store";

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

/** ZAP / VivaReal / OLX Imóveis padrão (VRSync-like). */
export function buildZapFeed(properties: Property[], agency: Agency): string {
  const now = new Date().toISOString();
  const listings = properties
    .map((p) => {
      const images = p.images
        .map((url, i) => `        <Media medium="image" primary="${i === 0 ? "true" : "false"}"><![CDATA[${url}]]></Media>`)
        .join("\n");
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
