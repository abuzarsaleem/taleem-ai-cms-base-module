-- Move tenant admin flag onto memberships.role and drop tenant_administrators

ALTER TABLE "taleem-ai-base".tenant_memberships
  ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'TENANT_MEMBER';

ALTER TABLE "taleem-ai-base".tenant_memberships
  DROP CONSTRAINT IF EXISTS chk_tenant_membership_role;

ALTER TABLE "taleem-ai-base".tenant_memberships
  ADD CONSTRAINT chk_tenant_membership_role
  CHECK (role IN ('TENANT_ADMIN', 'TENANT_MEMBER'));

-- Backfill admins from the legacy administrators table
UPDATE "taleem-ai-base".tenant_memberships m
SET role = 'TENANT_ADMIN',
    updated_at = now()
FROM "taleem-ai-base".tenant_administrators a
WHERE a.tenant_id = m.tenant_id
  AND a.user_id = m.user_id
  AND a.status = 'ACTIVE';

-- Ensure every active administrator still has a membership row
INSERT INTO "taleem-ai-base".tenant_memberships (tenant_id, user_id, status, role, joined_at)
SELECT a.tenant_id, a.user_id, 'ACTIVE', 'TENANT_ADMIN', COALESCE(a.assigned_at, now())
FROM "taleem-ai-base".tenant_administrators a
WHERE a.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM "taleem-ai-base".tenant_memberships m
    WHERE m.tenant_id = a.tenant_id AND m.user_id = a.user_id
  );

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_role
  ON "taleem-ai-base".tenant_memberships (tenant_id, role);

DROP TABLE IF EXISTS "taleem-ai-base".tenant_administrators;
