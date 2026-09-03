-- Seed tenant-scoped roles and permissions (reference catalog; runtime access is derived from membership tables)

INSERT INTO "taleem-ai-base".roles (role_code, role_name, description, is_system)
VALUES
  ('TENANT_ADMIN', 'Tenant Administrator', 'Manage institution users, profile, and branding', TRUE),
  ('TENANT_MEMBER', 'Tenant Member', 'Standard institution user with read-only tenant profile access', TRUE)
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO "taleem-ai-base".permissions (permission_code, name, description)
VALUES
  ('tenant.invite.read', 'Read Invitations', 'View pending tenant admin invitations'),
  ('tenant.invite.manage', 'Manage Invitations', 'Create, resend, and cancel tenant admin invitations'),
  ('tenant.members.read', 'Read Members', 'View tenant membership roster'),
  ('tenant.members.manage', 'Manage Members', 'Update or remove tenant memberships'),
  ('tenant.profile.read', 'Read Tenant Profile', 'View tenant profile, branding, and configuration'),
  ('tenant.profile.update', 'Update Tenant Profile', 'Modify tenant profile, branding, and configuration')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO "taleem-ai-base".role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM "taleem-ai-base".roles r
CROSS JOIN "taleem-ai-base".permissions p
WHERE r.role_code = 'TENANT_ADMIN'
  AND p.permission_code LIKE 'tenant.%'
ON CONFLICT DO NOTHING;

INSERT INTO "taleem-ai-base".role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM "taleem-ai-base".roles r
JOIN "taleem-ai-base".permissions p ON p.permission_code = 'tenant.profile.read'
WHERE r.role_code = 'TENANT_MEMBER'
ON CONFLICT DO NOTHING;
