-- OAuth 2.0 / OIDC session and token management

CREATE TABLE "taleem-ai-base".oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES "taleem-ai-base".applications (id) ON DELETE CASCADE,
  client_id VARCHAR(100) NOT NULL UNIQUE,
  client_name VARCHAR(150) NOT NULL,
  client_type VARCHAR(30) NOT NULL,
  client_secret_hash VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  redirect_uris JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_oauth_client_type CHECK (client_type IN ('PUBLIC', 'CONFIDENTIAL'))
);

CREATE TABLE "taleem-ai-base".application_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES "taleem-ai-base".applications (id) ON DELETE CASCADE,
  scope_code VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_application_scope UNIQUE (application_id, scope_code)
);

CREATE TABLE "taleem-ai-base".sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES "taleem-ai-base".tenants (id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES "taleem-ai-base".oauth_clients (id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  CONSTRAINT chk_session_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED'))
);

CREATE INDEX idx_sessions_user_id ON "taleem-ai-base".sessions (user_id);
CREATE INDEX idx_sessions_tenant_id ON "taleem-ai-base".sessions (tenant_id);
CREATE INDEX idx_sessions_status ON "taleem-ai-base".sessions (status);

CREATE TABLE "taleem-ai-base".authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash VARCHAR(255) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES "taleem-ai-base".oauth_clients (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES "taleem-ai-base".tenants (id) ON DELETE SET NULL,
  redirect_uri VARCHAR(500) NOT NULL,
  code_challenge VARCHAR(255) NOT NULL,
  code_challenge_method VARCHAR(20) NOT NULL DEFAULT 'S256',
  scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "taleem-ai-base".refresh_token_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES "taleem-ai-base".sessions (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "taleem-ai-base".users (id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES "taleem-ai-base".tenants (id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revocation_reason VARCHAR(255),
  CONSTRAINT chk_refresh_family_status CHECK (
    status IN ('ACTIVE', 'REVOKED', 'BREACH_SUSPECTED')
  )
);

CREATE TABLE "taleem-ai-base".refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES "taleem-ai-base".refresh_token_families (id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  replaced_by_id UUID REFERENCES "taleem-ai-base".refresh_tokens (id) ON DELETE SET NULL
);

CREATE TABLE "taleem-ai-base".audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES "taleem-ai-base".tenants (id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES "taleem-ai-base".users (id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_tenant_id ON "taleem-ai-base".audit_events (tenant_id);
CREATE INDEX idx_audit_events_actor_user_id ON "taleem-ai-base".audit_events (actor_user_id);
CREATE INDEX idx_audit_events_action ON "taleem-ai-base".audit_events (action);
CREATE INDEX idx_audit_events_created_at ON "taleem-ai-base".audit_events (created_at);
