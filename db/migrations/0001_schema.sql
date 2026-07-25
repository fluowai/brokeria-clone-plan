-- SquadIA — schema inicial
-- Multi-tenant + RLS + roles + trigger super_admin no primeiro usuário

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ Roles ============
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'gestor', 'corretor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'visit', 'proposal', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('apartment', 'house', 'land', 'commercial', 'rural');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_purpose AS ENUM ('sale', 'rent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Tenants ============
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ Users ============
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ============ User roles ============
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Trigger: primeiro usuário vira super_admin, demais viram admin do próprio tenant
CREATE OR REPLACE FUNCTION grant_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT count(*) FROM users) = 1 THEN
    INSERT INTO user_roles(user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_grant_default_role ON users;
CREATE TRIGGER trg_grant_default_role
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION grant_default_role();

-- ============ Leads (CRM) ============
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  email text,
  source text,
  stage lead_stage NOT NULL DEFAULT 'new',
  value_cents bigint NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);

-- ============ Properties ============
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  type property_type NOT NULL DEFAULT 'apartment',
  purpose property_purpose NOT NULL DEFAULT 'sale',
  price_cents bigint NOT NULL DEFAULT 0,
  area_m2 numeric(10,2),
  bedrooms int,
  bathrooms int,
  parking int,
  address text,
  city text,
  state text,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);

CREATE TABLE IF NOT EXISTS property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photos_property ON property_photos(property_id);

-- ============ WhatsApp ============
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text,
  last_message_at timestamptz,
  unread int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, contact_phone)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  body text NOT NULL,
  wa_msg_id text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_conv ON whatsapp_messages(conversation_id);

-- ============ AI chats ============
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent text NOT NULL,
  title text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system','user','assistant')),
  content text NOT NULL,
  tokens int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_msgs_chat ON ai_messages(chat_id);

-- ============ Billing ============
CREATE TABLE IF NOT EXISTS billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents int NOT NULL,
  credits int NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO billing_plans(code, name, price_cents, credits, features) VALUES
 ('starter','Starter',9700,500,'["1 corretor","CRM Kanban","Site público","500 créditos IA/mês"]'::jsonb),
 ('growth','Growth',29700,2500,'["Até 5 corretores","WhatsApp IA","Feeds ZAP/OLX","2500 créditos IA/mês","BI Cockpit"]'::jsonb),
 ('scale','Scale',69700,8000,'["Corretores ilimitados","Meta Ads integrado","Multi-imobiliária","8000 créditos IA/mês","Suporte prioritário"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES billing_plans(id),
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  delta int NOT NULL,
  reason text NOT NULL,
  ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credits_tenant ON credit_ledger(tenant_id);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES billing_plans(id),
  amount_cents int NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ Audit log ============
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
