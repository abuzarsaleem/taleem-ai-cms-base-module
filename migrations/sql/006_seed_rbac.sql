-- Seed platform roles and permissions for base module administration

INSERT INTO "taleem-ai-base".roles (role_code, role_name, description, is_system)
VALUES
  ('PLATFORM_ADMIN', 'Platform Administrator', 'Full platform administration access', TRUE),
  ('PLATFORM_SUPPORT', 'Platform Support', 'Read-only support and tenant assistance', TRUE)
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO "taleem-ai-base".permissions (permission_code, name, description)
VALUES
  ('platform.tenant.create', 'Create Tenant', 'Onboard new tenants'),
  ('platform.tenant.read', 'Read Tenant', 'View tenant details'),
  ('platform.tenant.update', 'Update Tenant', 'Modify tenant configuration'),
  ('platform.tenant.suspend', 'Suspend Tenant', 'Suspend tenant access'),
  ('platform.user.read', 'Read Users', 'View platform users'),
  ('platform.user.manage', 'Manage Users', 'Create and update platform users'),
  ('platform.subscription.manage', 'Manage Subscriptions', 'Manage tenant subscriptions'),
  ('platform.audit.read', 'Read Audit Log', 'View audit events')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO "taleem-ai-base".role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM "taleem-ai-base".roles r
CROSS JOIN "taleem-ai-base".permissions p
WHERE r.role_code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO "taleem-ai-base".role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM "taleem-ai-base".roles r
JOIN "taleem-ai-base".permissions p ON p.permission_code IN (
  'platform.tenant.read',
  'platform.user.read',
  'platform.audit.read'
)
WHERE r.role_code = 'PLATFORM_SUPPORT'
ON CONFLICT DO NOTHING;
