-- Merge tenant_branding into tenant_configurations and drop branding table

ALTER TABLE "taleem-ai-base".tenant_configurations
  ADD COLUMN IF NOT EXISTS logo_asset_id UUID,
  ADD COLUMN IF NOT EXISTS logo_dark_asset_id UUID,
  ADD COLUMN IF NOT EXISTS favicon_asset_id UUID,
  ADD COLUMN IF NOT EXISTS primary_color CHAR(7),
  ADD COLUMN IF NOT EXISTS secondary_color CHAR(7),
  ADD COLUMN IF NOT EXISTS accent_color CHAR(7),
  ADD COLUMN IF NOT EXISTS font_family TEXT,
  ADD COLUMN IF NOT EXISTS email_from_name TEXT,
  ADD COLUMN IF NOT EXISTS email_from_address CITEXT,
  ADD COLUMN IF NOT EXISTS support_email CITEXT;

ALTER TABLE "taleem-ai-base".tenant_configurations
  DROP CONSTRAINT IF EXISTS chk_config_primary_color,
  DROP CONSTRAINT IF EXISTS chk_config_secondary_color,
  DROP CONSTRAINT IF EXISTS chk_config_accent_color;

ALTER TABLE "taleem-ai-base".tenant_configurations
  ADD CONSTRAINT chk_config_primary_color CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT chk_config_secondary_color CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT chk_config_accent_color CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9A-Fa-f]{6}$');

-- Copy branding into existing configuration rows
UPDATE "taleem-ai-base".tenant_configurations c
SET
  logo_asset_id = b.logo_asset_id,
  logo_dark_asset_id = b.logo_dark_asset_id,
  favicon_asset_id = b.favicon_asset_id,
  primary_color = b.primary_color,
  secondary_color = b.secondary_color,
  accent_color = b.accent_color,
  font_family = b.font_family,
  email_from_name = b.email_from_name,
  email_from_address = b.email_from_address,
  support_email = b.support_email,
  updated_at = now()
FROM "taleem-ai-base".tenant_branding b
WHERE b.tenant_id = c.tenant_id;

-- Create configuration rows for tenants that only had branding
INSERT INTO "taleem-ai-base".tenant_configurations (
  tenant_id,
  logo_asset_id,
  logo_dark_asset_id,
  favicon_asset_id,
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  email_from_name,
  email_from_address,
  support_email
)
SELECT
  b.tenant_id,
  b.logo_asset_id,
  b.logo_dark_asset_id,
  b.favicon_asset_id,
  b.primary_color,
  b.secondary_color,
  b.accent_color,
  b.font_family,
  b.email_from_name,
  b.email_from_address,
  b.support_email
FROM "taleem-ai-base".tenant_branding b
WHERE NOT EXISTS (
  SELECT 1 FROM "taleem-ai-base".tenant_configurations c WHERE c.tenant_id = b.tenant_id
);

-- Drop old branding FKs then table
ALTER TABLE "taleem-ai-base".tenant_branding
  DROP CONSTRAINT IF EXISTS fk_branding_logo_asset,
  DROP CONSTRAINT IF EXISTS fk_branding_logo_dark_asset,
  DROP CONSTRAINT IF EXISTS fk_branding_favicon_asset,
  DROP CONSTRAINT IF EXISTS fk_tenant_branding_updated_by;

DROP TABLE IF EXISTS "taleem-ai-base".tenant_branding;

-- Re-add asset FKs on configuration
ALTER TABLE "taleem-ai-base".tenant_configurations
  DROP CONSTRAINT IF EXISTS fk_config_logo_asset,
  DROP CONSTRAINT IF EXISTS fk_config_logo_dark_asset,
  DROP CONSTRAINT IF EXISTS fk_config_favicon_asset;

ALTER TABLE "taleem-ai-base".tenant_configurations
  ADD CONSTRAINT fk_config_logo_asset FOREIGN KEY (logo_asset_id, tenant_id)
    REFERENCES "taleem-ai-base".tenant_assets (id, tenant_id),
  ADD CONSTRAINT fk_config_logo_dark_asset FOREIGN KEY (logo_dark_asset_id, tenant_id)
    REFERENCES "taleem-ai-base".tenant_assets (id, tenant_id),
  ADD CONSTRAINT fk_config_favicon_asset FOREIGN KEY (favicon_asset_id, tenant_id)
    REFERENCES "taleem-ai-base".tenant_assets (id, tenant_id);
