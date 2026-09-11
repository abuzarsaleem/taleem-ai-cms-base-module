-- Split Alumni into two catalog applications:
--   ALUMNI        → Alumni Portal (member)
--   ALUMNI_ADMIN  → Alumni Admin Portal
-- Migrate roles, permissions, entitlements, and access assignments.

-- 1) Register Alumni Admin Portal application
INSERT INTO "taleem-ai-base".applications (
  application_code, name, description, status, launch_url
)
VALUES (
  'ALUMNI_ADMIN',
  'Alumni Admin Portal',
  'Manage alumni registrations, members, events, and news',
  'ACTIVE',
  'https://taleem-ai-admin.vercel.app'
)
ON CONFLICT (application_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE',
  launch_url = COALESCE(NULLIF(EXCLUDED.launch_url, ''), "taleem-ai-base".applications.launch_url),
  updated_at = now();

-- 2) Alumni Portal is member-facing only
UPDATE "taleem-ai-base".applications
SET
  name = 'Alumni Portal',
  description = 'Member profile, directory, events, and announcements',
  launch_url = COALESCE(NULLIF(launch_url, ''), 'https://taleem-ai-cms.vercel.app'),
  updated_at = now()
WHERE application_code = 'ALUMNI';

-- 3) Move admin permissions onto ALUMNI_ADMIN
UPDATE "taleem-ai-base".application_permissions ap
SET application_id = admin_app.id
FROM "taleem-ai-base".applications alumni_app,
     "taleem-ai-base".applications admin_app
WHERE alumni_app.application_code = 'ALUMNI'
  AND admin_app.application_code = 'ALUMNI_ADMIN'
  AND ap.application_id = alumni_app.id
  AND ap.permission_code LIKE 'alumni.admin.%';

-- Ensure admin permissions exist on ALUMNI_ADMIN (idempotent for fresh DBs)
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
WHERE a.application_code = 'ALUMNI_ADMIN'
ON CONFLICT (application_id, permission_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4) Bind ALUMNI_ADMIN role to Alumni Admin Portal application
UPDATE "taleem-ai-base".roles r
SET application_id = admin_app.id,
    role_name = 'Alumni Admin',
    description = 'Access Alumni Admin Portal and manage alumni operations'
FROM "taleem-ai-base".applications admin_app
WHERE admin_app.application_code = 'ALUMNI_ADMIN'
  AND r.role_code = 'ALUMNI_ADMIN';

-- Keep ALUMNI_MEMBER on Alumni Portal
UPDATE "taleem-ai-base".roles r
SET application_id = alumni_app.id,
    role_name = 'Alumni Member',
    description = 'Access Alumni Portal'
FROM "taleem-ai-base".applications alumni_app
WHERE alumni_app.application_code = 'ALUMNI'
  AND r.role_code = 'ALUMNI_MEMBER';

-- 5) Rebuild ALUMNI_ADMIN role → admin permissions only
DELETE FROM "taleem-ai-base".role_permissions rp
USING "taleem-ai-base".roles r
WHERE rp.role_id = r.id
  AND r.role_code = 'ALUMNI_ADMIN';

INSERT INTO "taleem-ai-base".role_permissions (role_id, application_permission_id)
SELECT r.id, ap.id
FROM "taleem-ai-base".roles r
JOIN "taleem-ai-base".applications a ON a.id = r.application_id AND a.application_code = 'ALUMNI_ADMIN'
JOIN "taleem-ai-base".application_permissions ap ON ap.application_id = a.id
WHERE r.role_code = 'ALUMNI_ADMIN'
ON CONFLICT DO NOTHING;

-- 6) Copy ACTIVE ALUMNI entitlements → ALUMNI_ADMIN (existing tenants keep admin access)
INSERT INTO "taleem-ai-base".tenant_entitlements (
  tenant_id,
  application_id,
  subscription_id,
  status,
  effective_from,
  effective_until,
  commercial_reference,
  notes
)
SELECT
  te.tenant_id,
  admin_app.id,
  te.subscription_id,
  te.status,
  te.effective_from,
  te.effective_until,
  te.commercial_reference,
  COALESCE(te.notes, 'Mirrored from ALUMNI entitlement')
FROM "taleem-ai-base".tenant_entitlements te
JOIN "taleem-ai-base".applications alumni_app
  ON alumni_app.id = te.application_id AND alumni_app.application_code = 'ALUMNI'
JOIN "taleem-ai-base".applications admin_app
  ON admin_app.application_code = 'ALUMNI_ADMIN'
WHERE te.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM "taleem-ai-base".tenant_entitlements existing
    WHERE existing.tenant_id = te.tenant_id
      AND existing.application_id = admin_app.id
  );

-- Also add ALUMNI_ADMIN to subscription application_codes when ALUMNI is listed
UPDATE "taleem-ai-base".subscriptions s
SET application_codes = (
  SELECT COALESCE(jsonb_agg(DISTINCT code), '[]'::jsonb)
  FROM (
    SELECT jsonb_array_elements_text(COALESCE(s.application_codes, '[]'::jsonb)) AS code
    UNION
    SELECT 'ALUMNI_ADMIN'
  ) codes
),
updated_at = now()
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements_text(COALESCE(s.application_codes, '[]'::jsonb)) code
  WHERE code = 'ALUMNI'
)
AND NOT EXISTS (
  SELECT 1
  FROM jsonb_array_elements_text(COALESCE(s.application_codes, '[]'::jsonb)) code
  WHERE code = 'ALUMNI_ADMIN'
);

-- 7) Move ALUMNI_ADMIN access assignments onto ALUMNI_ADMIN application
UPDATE "taleem-ai-base".application_access_assignments aaa
SET application_id = admin_app.id,
    updated_at = now()
FROM "taleem-ai-base".roles r,
     "taleem-ai-base".applications alumni_app,
     "taleem-ai-base".applications admin_app
WHERE aaa.role_id = r.id
  AND r.role_code = 'ALUMNI_ADMIN'
  AND alumni_app.application_code = 'ALUMNI'
  AND admin_app.application_code = 'ALUMNI_ADMIN'
  AND aaa.application_id = alumni_app.id;

-- 8) Admins who previously used one role for both portals also get Alumni Portal (ALUMNI_MEMBER)
INSERT INTO "taleem-ai-base".application_access_assignments (
  tenant_id,
  identity_id,
  application_id,
  role_id,
  status,
  is_default,
  created_by,
  updated_by
)
SELECT
  aaa.tenant_id,
  aaa.identity_id,
  alumni_app.id,
  member_role.id,
  aaa.status,
  FALSE,
  aaa.created_by,
  aaa.updated_by
FROM "taleem-ai-base".application_access_assignments aaa
JOIN "taleem-ai-base".roles admin_role ON admin_role.id = aaa.role_id AND admin_role.role_code = 'ALUMNI_ADMIN'
JOIN "taleem-ai-base".applications admin_app
  ON admin_app.id = aaa.application_id AND admin_app.application_code = 'ALUMNI_ADMIN'
JOIN "taleem-ai-base".applications alumni_app ON alumni_app.application_code = 'ALUMNI'
JOIN "taleem-ai-base".roles member_role
  ON member_role.role_code = 'ALUMNI_MEMBER' AND member_role.application_id = alumni_app.id
WHERE NOT EXISTS (
  SELECT 1
  FROM "taleem-ai-base".application_access_assignments existing
  WHERE existing.tenant_id = aaa.tenant_id
    AND existing.identity_id = aaa.identity_id
    AND existing.application_id = alumni_app.id
);
