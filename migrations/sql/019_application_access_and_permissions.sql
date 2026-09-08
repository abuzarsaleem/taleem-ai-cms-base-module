-- Application-scoped permissions, access assignments, and Alumni portal/admin roles.
-- Platform RBAC (permissions/roles without application_id) stays unchanged.

-- 1) Application permission catalogue
CREATE TABLE IF NOT EXISTS "taleem-ai-base".application_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES "taleem-ai-base".applications (id) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_application_permission_code UNIQUE (application_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_application_permissions_application_id
  ON "taleem-ai-base".application_permissions (application_id);

-- 2) Extend roles for application-scoped system/custom roles
ALTER TABLE "taleem-ai-base".roles
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES "taleem-ai-base".applications (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".roles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".roles
  ADD COLUMN IF NOT EXISTS role_type VARCHAR(30);

UPDATE "taleem-ai-base".roles
SET role_type = CASE WHEN is_system THEN 'SYSTEM' ELSE 'CUSTOM' END
WHERE role_type IS NULL;

ALTER TABLE "taleem-ai-base".roles
  ALTER COLUMN role_type SET DEFAULT 'SYSTEM';

ALTER TABLE "taleem-ai-base".roles
  ALTER COLUMN role_type SET NOT NULL;

ALTER TABLE "taleem-ai-base".roles
  DROP CONSTRAINT IF EXISTS chk_role_type;

ALTER TABLE "taleem-ai-base".roles
  ADD CONSTRAINT chk_role_type CHECK (role_type IN ('SYSTEM', 'CUSTOM'));

ALTER TABLE "taleem-ai-base".roles
  DROP CONSTRAINT IF EXISTS chk_custom_role_tenant;

ALTER TABLE "taleem-ai-base".roles
  ADD CONSTRAINT chk_custom_role_tenant CHECK (
    (role_type = 'SYSTEM' AND tenant_id IS NULL)
    OR (role_type = 'CUSTOM' AND tenant_id IS NOT NULL AND application_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_roles_application_id
  ON "taleem-ai-base".roles (application_id);

CREATE INDEX IF NOT EXISTS idx_roles_tenant_id
  ON "taleem-ai-base".roles (tenant_id);

-- 3) Allow role_permissions to grant application permissions (platform permissions unchanged)
ALTER TABLE "taleem-ai-base".role_permissions
  ADD COLUMN IF NOT EXISTS application_permission_id UUID
    REFERENCES "taleem-ai-base".application_permissions (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".role_permissions
  ALTER COLUMN permission_id DROP NOT NULL;

ALTER TABLE "taleem-ai-base".role_permissions
  DROP CONSTRAINT IF EXISTS uq_role_permission;

ALTER TABLE "taleem-ai-base".role_permissions
  DROP CONSTRAINT IF EXISTS chk_role_permission_target;

ALTER TABLE "taleem-ai-base".role_permissions
  ADD CONSTRAINT chk_role_permission_target CHECK (
    (permission_id IS NOT NULL AND application_permission_id IS NULL)
    OR (permission_id IS NULL AND application_permission_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_role_platform_permission
  ON "taleem-ai-base".role_permissions (role_id, permission_id)
  WHERE permission_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_role_application_permission
  ON "taleem-ai-base".role_permissions (role_id, application_permission_id)
  WHERE application_permission_id IS NOT NULL;

-- 4) Member ↔ application access (entitlement ≠ access)
CREATE TABLE IF NOT EXISTS "taleem-ai-base".application_access_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES "taleem-ai-base".applications (id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES "taleem-ai-base".roles (id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES "taleem-ai-base".users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES "taleem-ai-base".users (id) ON DELETE SET NULL,
  CONSTRAINT uq_application_access_assignment UNIQUE (tenant_id, user_id, application_id),
  CONSTRAINT chk_application_access_status CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')
  )
);

CREATE INDEX IF NOT EXISTS idx_app_access_tenant_id
  ON "taleem-ai-base".application_access_assignments (tenant_id);

CREATE INDEX IF NOT EXISTS idx_app_access_user_id
  ON "taleem-ai-base".application_access_assignments (user_id);

CREATE INDEX IF NOT EXISTS idx_app_access_application_id
  ON "taleem-ai-base".application_access_assignments (application_id);

CREATE INDEX IF NOT EXISTS idx_app_access_role_id
  ON "taleem-ai-base".application_access_assignments (role_id);

-- One active default application per tenant membership
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_access_default_per_member
  ON "taleem-ai-base".application_access_assignments (tenant_id, user_id)
  WHERE is_default = TRUE AND status = 'ACTIVE';

-- 5) Entitlement improvements (opaque commercial reference; no pricing)
ALTER TABLE "taleem-ai-base".tenant_entitlements
  ADD COLUMN IF NOT EXISTS commercial_reference VARCHAR(150);

ALTER TABLE "taleem-ai-base".tenant_entitlements
  ADD COLUMN IF NOT EXISTS notes VARCHAR(500);

-- ---------------------------------------------------------------------------
-- Seed: ALUMNI application + member portal + admin portal roles/permissions
-- ---------------------------------------------------------------------------

INSERT INTO "taleem-ai-base".applications (
  application_code, name, description, status, launch_url
)
VALUES (
  'ALUMNI',
  'Alumni',
  'Taleem Alumni member and admin portals',
  'ACTIVE',
  'https://alumni.taleem.ai'
)
ON CONFLICT (application_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE',
  updated_at = now();

-- Member portal permissions
INSERT INTO "taleem-ai-base".application_permissions (application_id, permission_code, name, description)
SELECT a.id, v.permission_code, v.name, v.description
FROM "taleem-ai-base".applications a
CROSS JOIN (
  VALUES
    ('alumni.portal.access', 'Access Alumni Portal', 'Enter the Alumni member portal'),
    ('alumni.profile.read', 'Read Alumni Profile', 'View own alumni profile'),
    ('alumni.profile.update', 'Update Alumni Profile', 'Update own alumni profile'),
    ('alumni.directory.read', 'Read Alumni Directory', 'Browse alumni directory'),
    ('alumni.events.read', 'Read Alumni Events', 'View alumni events'),
    ('alumni.news.read', 'Read Alumni News', 'View alumni news')
) AS v(permission_code, name, description)
WHERE a.application_code = 'ALUMNI'
ON CONFLICT (application_id, permission_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Admin portal permissions
INSERT INTO "taleem-ai-base".application_permissions (application_id, permission_code, name, description)
SELECT a.id, v.permission_code, v.name, v.description
FROM "taleem-ai-base".applications a
CROSS JOIN (
  VALUES
    ('alumni.admin.access', 'Access Alumni Admin Portal', 'Enter the Alumni admin portal'),
    ('alumni.admin.members.read', 'Read Alumni Members', 'View alumni member roster'),
    ('alumni.admin.members.manage', 'Manage Alumni Members', 'Approve, update, or suspend alumni members'),
    ('alumni.admin.events.manage', 'Manage Alumni Events', 'Create and manage alumni events'),
    ('alumni.admin.news.manage', 'Manage Alumni News', 'Create and manage alumni news'),
    ('alumni.admin.reports.read', 'Read Alumni Reports', 'View alumni analytics/reports'),
    ('alumni.admin.settings.manage', 'Manage Alumni Settings', 'Manage alumni application settings')
) AS v(permission_code, name, description)
WHERE a.application_code = 'ALUMNI'
ON CONFLICT (application_id, permission_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- System roles for Alumni portals
INSERT INTO "taleem-ai-base".roles (
  role_code, role_name, description, is_system, role_type, application_id, tenant_id
)
SELECT
  'ALUMNI_MEMBER',
  'Alumni Member',
  'Access Alumni member portal',
  TRUE,
  'SYSTEM',
  a.id,
  NULL
FROM "taleem-ai-base".applications a
WHERE a.application_code = 'ALUMNI'
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_system = TRUE,
  role_type = 'SYSTEM',
  application_id = EXCLUDED.application_id,
  tenant_id = NULL;

INSERT INTO "taleem-ai-base".roles (
  role_code, role_name, description, is_system, role_type, application_id, tenant_id
)
SELECT
  'ALUMNI_ADMIN',
  'Alumni Admin',
  'Access Alumni admin portal and manage alumni operations',
  TRUE,
  'SYSTEM',
  a.id,
  NULL
FROM "taleem-ai-base".applications a
WHERE a.application_code = 'ALUMNI'
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_system = TRUE,
  role_type = 'SYSTEM',
  application_id = EXCLUDED.application_id,
  tenant_id = NULL;

-- ALUMNI_MEMBER → member portal permissions
INSERT INTO "taleem-ai-base".role_permissions (role_id, application_permission_id)
SELECT r.id, ap.id
FROM "taleem-ai-base".roles r
JOIN "taleem-ai-base".applications a ON a.id = r.application_id AND a.application_code = 'ALUMNI'
JOIN "taleem-ai-base".application_permissions ap ON ap.application_id = a.id
WHERE r.role_code = 'ALUMNI_MEMBER'
  AND ap.permission_code IN (
    'alumni.portal.access',
    'alumni.profile.read',
    'alumni.profile.update',
    'alumni.directory.read',
    'alumni.events.read',
    'alumni.news.read'
  )
ON CONFLICT DO NOTHING;

-- ALUMNI_ADMIN → admin + member portal permissions
INSERT INTO "taleem-ai-base".role_permissions (role_id, application_permission_id)
SELECT r.id, ap.id
FROM "taleem-ai-base".roles r
JOIN "taleem-ai-base".applications a ON a.id = r.application_id AND a.application_code = 'ALUMNI'
JOIN "taleem-ai-base".application_permissions ap ON ap.application_id = a.id
WHERE r.role_code = 'ALUMNI_ADMIN'
ON CONFLICT DO NOTHING;
