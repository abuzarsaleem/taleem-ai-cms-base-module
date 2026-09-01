-- Tenant management domain (from Excel: tenant management sheet)

CREATE TABLE "taleem-ai-base".tenants (
  id UUID PRIMARY KEY DEFAULT "taleem-ai-base".uuid_generate_v7(),
  tenant_code VARCHAR(50) NOT NULL UNIQUE,
  legal_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  institution_type VARCHAR(50) NOT NULL,
  website_url VARCHAR(500),
  status VARCHAR(30) NOT NULL DEFAULT 'ONBOARDING',
  deployment_model VARCHAR(30) NOT NULL DEFAULT 'SAAS',
  country_code CHAR(2) NOT NULL DEFAULT 'PK',
  province_code VARCHAR(20),
  city VARCHAR(100),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_tenants_status ON "taleem-ai-base".tenants (status);
CREATE INDEX idx_tenants_institution_type ON "taleem-ai-base".tenants (institution_type);
CREATE INDEX idx_tenants_province_code ON "taleem-ai-base".tenants (province_code);
CREATE INDEX idx_tenants_city ON "taleem-ai-base".tenants (city);

CREATE TABLE "taleem-ai-base".tenant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  contact_type VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  designation VARCHAR(150),
  department VARCHAR(150),
  responsibility VARCHAR(500),
  email VARCHAR(255),
  mobile_phone VARCHAR(30),
  landline_phone VARCHAR(30),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_tenant_contacts_tenant_id ON "taleem-ai-base".tenant_contacts (tenant_id);
CREATE INDEX idx_tenant_contacts_contact_type ON "taleem-ai-base".tenant_contacts (contact_type);
CREATE INDEX idx_tenant_contacts_email ON "taleem-ai-base".tenant_contacts (email);

CREATE TABLE "taleem-ai-base".tenant_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  address_type VARCHAR(30) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  area VARCHAR(150),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  province_code VARCHAR(20),
  postal_code VARCHAR(20),
  country_code CHAR(2) NOT NULL DEFAULT 'PK',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_tenant_addresses_tenant_id ON "taleem-ai-base".tenant_addresses (tenant_id);
CREATE INDEX idx_tenant_addresses_city ON "taleem-ai-base".tenant_addresses (city);

CREATE TABLE "taleem-ai-base".tenant_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  identifier_type VARCHAR(50) NOT NULL,
  identifier_value VARCHAR(150) NOT NULL,
  issuing_authority VARCHAR(150),
  issue_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_identifiers_tenant_id ON "taleem-ai-base".tenant_identifiers (tenant_id);
CREATE INDEX idx_tenant_identifiers_type ON "taleem-ai-base".tenant_identifiers (identifier_type);
CREATE INDEX idx_tenant_identifiers_value ON "taleem-ai-base".tenant_identifiers (identifier_value);

CREATE TABLE "taleem-ai-base".tenant_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Karachi',
  locale VARCHAR(20) NOT NULL DEFAULT 'en-PK',
  date_format VARCHAR(30),
  currency_code CHAR(3) NOT NULL DEFAULT 'PKR',
  branding_name VARCHAR(255),
  logo_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE TABLE "taleem-ai-base".tenant_smtp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  host VARCHAR(255) NOT NULL,
  port SMALLINT NOT NULL DEFAULT 587,
  username VARCHAR(255),
  password_secret_ref VARCHAR(500),
  encryption VARCHAR(20) NOT NULL DEFAULT 'TLS',
  from_name VARCHAR(255),
  from_email VARCHAR(255),
  reply_to_email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE TABLE "taleem-ai-base".tenant_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_name VARCHAR(255),
  content_type VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_tenant_asset_tenant UNIQUE (id, tenant_id)
);

CREATE INDEX idx_tenant_assets_tenant_id ON "taleem-ai-base".tenant_assets (tenant_id);

CREATE TABLE "taleem-ai-base".institution_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  campus_type VARCHAR(100),
  institution_type VARCHAR(50),
  website VARCHAR(500),
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(30),
  country_code VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "taleem-ai-base".tenant_branding (
  id UUID PRIMARY KEY DEFAULT "taleem-ai-base".uuid_generate_v7(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  logo_asset_id UUID,
  logo_dark_asset_id UUID,
  favicon_asset_id UUID,
  primary_color CHAR(7) CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color CHAR(7) CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color CHAR(7) CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  font_family TEXT,
  email_from_name TEXT,
  email_from_address CITEXT,
  support_email CITEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT fk_branding_logo_asset FOREIGN KEY (logo_asset_id, tenant_id)
    REFERENCES "taleem-ai-base".tenant_assets (id, tenant_id),
  CONSTRAINT fk_branding_logo_dark_asset FOREIGN KEY (logo_dark_asset_id, tenant_id)
    REFERENCES "taleem-ai-base".tenant_assets (id, tenant_id),
  CONSTRAINT fk_branding_favicon_asset FOREIGN KEY (favicon_asset_id, tenant_id)
    REFERENCES "taleem-ai-base".tenant_assets (id, tenant_id)
);
