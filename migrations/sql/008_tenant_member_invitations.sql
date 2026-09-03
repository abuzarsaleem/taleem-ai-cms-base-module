-- Tenant member invitations (non-admin users)

CREATE TABLE "taleem-ai-base".tenant_member_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by UUID NOT NULL REFERENCES "taleem-ai-base".users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_member_invitation_status CHECK (
    status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')
  )
);

CREATE INDEX idx_tenant_member_invitations_tenant_id
  ON "taleem-ai-base".tenant_member_invitations (tenant_id);

CREATE INDEX idx_tenant_member_invitations_email
  ON "taleem-ai-base".tenant_member_invitations (tenant_id, email);
