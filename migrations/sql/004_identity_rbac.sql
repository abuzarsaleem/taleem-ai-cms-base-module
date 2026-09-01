-- Identity & access management (users, RBAC)

CREATE TABLE "taleem-ai-base".users (
  id UUID PRIMARY KEY DEFAULT "taleem-ai-base".uuid_generate_v7(),
  email CITEXT NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  full_name VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

CREATE TABLE "taleem-ai-base".user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  provider_type VARCHAR(50) NOT NULL,
  provider_subject VARCHAR(255),
  identifier VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_identities_user_id ON "taleem-ai-base".user_identities (user_id);
CREATE INDEX idx_user_identities_provider ON "taleem-ai-base".user_identities (provider_type, provider_subject);

CREATE TABLE "taleem-ai-base".tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_tenant_membership UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_memberships_tenant_id ON "taleem-ai-base".tenant_memberships (tenant_id);
CREATE INDEX idx_tenant_memberships_user_id ON "taleem-ai-base".tenant_memberships (user_id);

ALTER TABLE "taleem-ai-base".tenant_administrators
  ADD CONSTRAINT fk_tenant_administrators_user
  FOREIGN KEY (user_id) REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".tenant_branding
  ADD CONSTRAINT fk_tenant_branding_updated_by
  FOREIGN KEY (updated_by) REFERENCES "taleem-ai-base".users (id) ON DELETE SET NULL;

CREATE TABLE "taleem-ai-base".roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code VARCHAR(50) NOT NULL UNIQUE,
  role_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "taleem-ai-base".permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "taleem-ai-base".role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES "taleem-ai-base".roles (id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES "taleem-ai-base".permissions (id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE "taleem-ai-base".user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES "taleem-ai-base".roles (id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES "taleem-ai-base".users (id) ON DELETE SET NULL,
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE "taleem-ai-base".tenant_admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by UUID NOT NULL REFERENCES "taleem-ai-base".users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_admin_invitation_status CHECK (
    status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')
  )
);

CREATE TABLE "taleem-ai-base".user_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  token_type VARCHAR(30) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_verification_token_type CHECK (
    token_type IN ('PASSWORD_RESET', 'EMAIL_VERIFICATION')
  )
);

CREATE INDEX idx_user_verification_tokens_user_id ON "taleem-ai-base".user_verification_tokens (user_id);
