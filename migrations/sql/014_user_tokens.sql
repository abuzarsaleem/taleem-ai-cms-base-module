-- Unified user tokens: password reset, email verification, tenant invitations, refresh tokens

CREATE TABLE "taleem-ai-base".user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_type VARCHAR(40) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  email VARCHAR(255),
  membership_role VARCHAR(30),
  status VARCHAR(30),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  invited_by UUID REFERENCES "taleem-ai-base".users (id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_user_token_type CHECK (
    token_type IN ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'TENANT_INVITATION', 'REFRESH_TOKEN')
  ),
  CONSTRAINT chk_user_token_status CHECK (
    status IS NULL OR status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')
  )
);

INSERT INTO "taleem-ai-base".user_tokens (
  id, token_type, token_hash, user_id, expires_at, used_at, ip_address, created_at
)
SELECT id, token_type, token_hash, user_id, expires_at, used_at, ip_address, created_at
FROM "taleem-ai-base".user_verification_tokens;

INSERT INTO "taleem-ai-base".user_tokens (
  id,
  token_type,
  token_hash,
  tenant_id,
  email,
  membership_role,
  status,
  expires_at,
  used_at,
  invited_by,
  metadata,
  created_at
)
SELECT
  id,
  'TENANT_INVITATION',
  token_hash,
  tenant_id,
  email,
  'TENANT_ADMIN',
  status,
  expires_at,
  accepted_at,
  invited_by,
  CASE
    WHEN first_name IS NOT NULL OR last_name IS NOT NULL THEN
      jsonb_build_object('firstName', first_name, 'lastName', last_name)
    ELSE NULL
  END,
  created_at
FROM "taleem-ai-base".tenant_admin_invitations;

INSERT INTO "taleem-ai-base".user_tokens (
  id,
  token_type,
  token_hash,
  tenant_id,
  email,
  membership_role,
  status,
  expires_at,
  used_at,
  invited_by,
  created_at
)
SELECT
  id,
  'TENANT_INVITATION',
  token_hash,
  tenant_id,
  email,
  'TENANT_MEMBER',
  status,
  expires_at,
  accepted_at,
  invited_by,
  created_at
FROM "taleem-ai-base".tenant_member_invitations;

INSERT INTO "taleem-ai-base".user_tokens (
  id, token_type, token_hash, user_id, expires_at, revoked_at, created_at
)
SELECT id, 'REFRESH_TOKEN', token_hash, user_id, expires_at, revoked_at, created_at
FROM "taleem-ai-base".user_refresh_tokens;

DROP TABLE "taleem-ai-base".user_verification_tokens;
DROP TABLE "taleem-ai-base".tenant_admin_invitations;
DROP TABLE "taleem-ai-base".tenant_member_invitations;
DROP TABLE "taleem-ai-base".user_refresh_tokens;

CREATE INDEX idx_user_tokens_user_id
  ON "taleem-ai-base".user_tokens (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_user_tokens_tenant_email
  ON "taleem-ai-base".user_tokens (tenant_id, email)
  WHERE tenant_id IS NOT NULL AND email IS NOT NULL;

CREATE INDEX idx_user_tokens_type ON "taleem-ai-base".user_tokens (token_type);
CREATE INDEX idx_user_tokens_expires_at ON "taleem-ai-base".user_tokens (expires_at);
