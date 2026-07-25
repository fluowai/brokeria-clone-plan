-- SquadIA — multi-vertical
-- Adds vertical support to tenants + properties and creates domain tables
-- for developments (incorporadora/construtora), parcelamentos (loteadora),
-- lots, contracts, and documents.

DO $$ BEGIN
  CREATE TYPE tenant_vertical AS ENUM ('urban', 'rural', 'developer', 'land');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS vertical tenant_vertical NOT NULL DEFAULT 'urban',
  ADD COLUMN IF NOT EXISTS verticals tenant_vertical[] NOT NULL DEFAULT ARRAY['urban']::tenant_vertical[];

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS vertical tenant_vertical NOT NULL DEFAULT 'urban',
  -- Rural
  ADD COLUMN IF NOT EXISTS area_hectares numeric(12,2),
  ADD COLUMN IF NOT EXISTS atividade text,          -- pecuaria|agricola|misto
  ADD COLUMN IF NOT EXISTS agua text,               -- acude|rio|poco|nenhum
  ADD COLUMN IF NOT EXISTS energia boolean,
  ADD COLUMN IF NOT EXISTS car_code text,           -- Cadastro Ambiental Rural
  ADD COLUMN IF NOT EXISTS matricula text,
  ADD COLUMN IF NOT EXISTS itr text,
  ADD COLUMN IF NOT EXISTS topografia text,
  ADD COLUMN IF NOT EXISTS distancia_cidade_km numeric(8,2),
  -- Incorporadora
  ADD COLUMN IF NOT EXISTS development_id uuid,
  ADD COLUMN IF NOT EXISTS tipologia text,
  ADD COLUMN IF NOT EXISTS andar int,
  ADD COLUMN IF NOT EXISTS posicao_solar text;

-- ============ Developments (Incorporadora / Construtora) ============
CREATE TABLE IF NOT EXISTS developments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'lancamento',   -- lancamento|obras|pronto
  previsao_entrega date,
  vgv_cents bigint NOT NULL DEFAULT 0,
  torres int,
  unidades_total int,
  unidades_vendidas int NOT NULL DEFAULT 0,
  obra_percent int NOT NULL DEFAULT 0,
  memorial text,
  tour360_url text,
  stand_endereco text,
  city text,
  state text,
  cover_url text,
  slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_developments_tenant ON developments(tenant_id);

ALTER TABLE properties
  ADD CONSTRAINT fk_properties_development
  FOREIGN KEY (development_id) REFERENCES developments(id) ON DELETE SET NULL
  NOT VALID;

-- ============ Parcelamentos (Loteadora) ============
CREATE TABLE IF NOT EXISTS parcelamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_lotes int NOT NULL DEFAULT 0,
  area_total_m2 numeric(14,2),
  infraestrutura jsonb NOT NULL DEFAULT '[]'::jsonb,
  aprovacao_prefeitura text,
  registro_ri text,
  garantia_hipotecaria boolean NOT NULL DEFAULT false,
  city text,
  state text,
  slug text,
  cover_url text,
  map_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_tenant ON parcelamentos(tenant_id);

DO $$ BEGIN
  CREATE TYPE lot_status AS ENUM ('disponivel','reservado','vendido','quitado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parcelamento_id uuid NOT NULL REFERENCES parcelamentos(id) ON DELETE CASCADE,
  quadra text NOT NULL,
  lote text NOT NULL,
  area_m2 numeric(10,2),
  frente_m numeric(8,2),
  status lot_status NOT NULL DEFAULT 'disponivel',
  preco_avista_cents bigint NOT NULL DEFAULT 0,
  preco_parcelado_cents bigint,
  entrada_cents bigint,
  parcelas int,
  lat numeric(10,7),
  lng numeric(10,7),
  reserved_until timestamptz,
  reserved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parcelamento_id, quadra, lote)
);
CREATE INDEX IF NOT EXISTS idx_lots_parcelamento ON lots(parcelamento_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);

-- ============ Contracts (parcelamento / incorporadora) ============
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES lots(id) ON DELETE SET NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL,
  cliente_doc text,
  valor_total_cents bigint NOT NULL,
  entrada_cents bigint NOT NULL DEFAULT 0,
  n_parcelas int NOT NULL DEFAULT 1,
  valor_parcela_cents bigint,
  indice text,                     -- INCC|IGPM|IPCA|NENHUM
  status text NOT NULL DEFAULT 'ativo', -- ativo|quitado|distratado|inadimplente
  assinado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);

-- ============ Documents ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_kind text NOT NULL,   -- property|development|parcelamento|lot|contract
  owner_id uuid NOT NULL,
  kind text NOT NULL,         -- matricula|itr|iptu|planta|memorial|contrato|outros
  url text NOT NULL,
  filename text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_kind, owner_id);
