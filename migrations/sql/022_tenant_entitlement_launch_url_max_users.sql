-- Per-tenant application launch URL and licensed user seats on entitlements.

ALTER TABLE "taleem-ai-base".tenant_entitlements
  ADD COLUMN IF NOT EXISTS launch_url VARCHAR(500);

ALTER TABLE "taleem-ai-base".tenant_entitlements
  ADD COLUMN IF NOT EXISTS max_users INTEGER;

ALTER TABLE "taleem-ai-base".tenant_entitlements
  DROP CONSTRAINT IF EXISTS chk_tenant_entitlements_max_users;

ALTER TABLE "taleem-ai-base".tenant_entitlements
  ADD CONSTRAINT chk_tenant_entitlements_max_users
  CHECK (max_users IS NULL OR max_users > 0);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_entitlements_tenant_app
  ON "taleem-ai-base".tenant_entitlements (tenant_id, application_id);

COMMENT ON COLUMN "taleem-ai-base".tenant_entitlements.launch_url IS
  'Tenant-specific application launch URL; NULL falls back to applications.launch_url';

COMMENT ON COLUMN "taleem-ai-base".tenant_entitlements.max_users IS
  'Licensed user seats for this tenant+application; NULL means unlimited';
