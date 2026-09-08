-- v4.0 IAM refactor: replace `users` + `user_identities` with normalized identity tables.
-- Existing user UUIDs are reused as identity IDs so already-issued JWTs and every
-- downstream foreign key keep resolving to the same principal.

-- ---------------------------------------------------------------------------
-- 1) Identity core
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "taleem-ai-base".identities (
  id UUID PRIMARY KEY DEFAULT "taleem-ai-base".uuid_generate_v7(),
  identity_type VARCHAR(30) NOT NULL DEFAULT 'PERSON',
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_identity_type CHECK (identity_type IN ('PERSON', 'SERVICE', 'SYSTEM')),
  CONSTRAINT chk_identity_status CHECK (
    status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'INVITED', 'DISABLED')
  )
);

CREATE INDEX IF NOT EXISTS idx_identities_status ON "taleem-ai-base".identities (status);

CREATE TABLE IF NOT EXISTS "taleem-ai-base".identity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL UNIQUE
    REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(150) NOT NULL,
  profile_photo VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "taleem-ai-base".identity_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL
    REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE,
  identifier_type VARCHAR(30) NOT NULL,
  identifier_value CITEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_identity_identifier_value UNIQUE (identifier_type, identifier_value),
  CONSTRAINT chk_identity_identifier_type CHECK (
    identifier_type IN ('EMAIL', 'PHONE', 'USERNAME', 'EXTERNAL')
  ),
  CONSTRAINT chk_identity_identifier_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_identity_identifiers_identity_id
  ON "taleem-ai-base".identity_identifiers (identity_id);

-- At most one primary identifier per identity and type
CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_primary_identifier
  ON "taleem-ai-base".identity_identifiers (identity_id, identifier_type)
  WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS "taleem-ai-base".identity_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL
    REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE,
  credential_type VARCHAR(30) NOT NULL,
  credential_reference VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_identity_credential UNIQUE (identity_id, credential_type),
  CONSTRAINT chk_identity_credential_type CHECK (
    credential_type IN ('PASSWORD', 'TOTP', 'WEBAUTHN', 'API_KEY')
  ),
  CONSTRAINT chk_identity_credential_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_identity_credentials_identity_id
  ON "taleem-ai-base".identity_credentials (identity_id);

CREATE TABLE IF NOT EXISTS "taleem-ai-base".authentication_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL
    REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  provider_reference VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_authentication_method UNIQUE (identity_id, method_type),
  CONSTRAINT chk_authentication_method_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_authentication_methods_identity_id
  ON "taleem-ai-base".authentication_methods (identity_id);

CREATE INDEX IF NOT EXISTS idx_authentication_methods_provider
  ON "taleem-ai-base".authentication_methods (method_type, provider_reference);

CREATE TABLE IF NOT EXISTS "taleem-ai-base".identity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL
    REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE,
  session_reference VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_sessions_identity_id
  ON "taleem-ai-base".identity_sessions (identity_id);

-- ---------------------------------------------------------------------------
-- 2) Backfill from users / user_identities / user_tokens
-- ---------------------------------------------------------------------------

INSERT INTO "taleem-ai-base".identities (
  id, identity_type, status, last_login_at, created_at, updated_at
)
SELECT u.id, 'PERSON', u.status, u.last_login_at, u.created_at, u.updated_at
FROM "taleem-ai-base".users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO "taleem-ai-base".identity_profiles (
  identity_id, display_name, profile_photo, created_at, updated_at
)
SELECT u.id, u.full_name, u.avatar_url, u.created_at, u.updated_at
FROM "taleem-ai-base".users u
ON CONFLICT (identity_id) DO NOTHING;

INSERT INTO "taleem-ai-base".identity_identifiers (
  identity_id, identifier_type, identifier_value, is_primary, is_verified, status,
  created_at, updated_at
)
SELECT u.id, 'EMAIL', u.email, TRUE, u.email_verified, 'ACTIVE', u.created_at, u.updated_at
FROM "taleem-ai-base".users u
ON CONFLICT (identifier_type, identifier_value) DO NOTHING;

INSERT INTO "taleem-ai-base".identity_credentials (
  identity_id, credential_type, credential_reference, status, created_at, updated_at
)
SELECT u.id, 'PASSWORD', u.password_hash, 'ACTIVE', u.created_at, u.updated_at
FROM "taleem-ai-base".users u
WHERE u.password_hash IS NOT NULL
ON CONFLICT (identity_id, credential_type) DO NOTHING;

-- LOCAL provider becomes the PASSWORD method; social providers keep their code.
INSERT INTO "taleem-ai-base".authentication_methods (
  identity_id, method_type, status, provider_reference, metadata, created_at, updated_at
)
SELECT DISTINCT ON (src.identity_id, src.method_type)
  src.identity_id,
  src.method_type,
  'ACTIVE',
  src.provider_reference,
  src.metadata,
  src.created_at,
  src.updated_at
FROM (
  SELECT
    ui.user_id AS identity_id,
    CASE WHEN ui.provider_type = 'LOCAL' THEN 'PASSWORD' ELSE ui.provider_type END
      AS method_type,
    ui.provider_subject AS provider_reference,
    jsonb_build_object(
      'identifier', ui.identifier,
      'isPrimary', ui.is_primary,
      'legacyProviderType', ui.provider_type
    ) AS metadata,
    ui.created_at,
    ui.updated_at
  FROM "taleem-ai-base".user_identities ui
  WHERE EXISTS (SELECT 1 FROM "taleem-ai-base".identities i WHERE i.id = ui.user_id)
) src
ORDER BY src.identity_id, src.method_type, src.created_at
ON CONFLICT (identity_id, method_type) DO NOTHING;

-- Live platform refresh tokens become identity sessions (session_reference = token id)
INSERT INTO "taleem-ai-base".identity_sessions (
  id, identity_id, session_reference, created_at, expires_at, revoked_at, last_activity_at
)
SELECT t.id, t.user_id, t.id::TEXT, t.created_at, t.expires_at, t.revoked_at, t.created_at
FROM "taleem-ai-base".user_tokens t
WHERE t.token_type = 'REFRESH_TOKEN'
  AND t.revoked_at IS NULL
  AND t.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM "taleem-ai-base".identities i WHERE i.id = t.user_id)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Detach every foreign key that still points at `users`
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  rec RECORD;
BEGIN
  IF to_regclass('"taleem-ai-base".users') IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT nsp.nspname AS schema_name, cls.relname AS table_name, con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
    WHERE con.contype = 'f'
      AND con.confrelid = '"taleem-ai-base".users'::regclass
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      rec.schema_name, rec.table_name, rec.constraint_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Repoint user_id columns at identities
-- ---------------------------------------------------------------------------

-- 4a) tenant_memberships
ALTER TABLE "taleem-ai-base".tenant_memberships
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".tenant_memberships
SET identity_id = user_id
WHERE identity_id IS NULL;

DELETE FROM "taleem-ai-base".tenant_memberships WHERE identity_id IS NULL;

ALTER TABLE "taleem-ai-base".tenant_memberships
  ALTER COLUMN identity_id SET NOT NULL;

ALTER TABLE "taleem-ai-base".tenant_memberships
  DROP CONSTRAINT IF EXISTS uq_tenant_membership;

DROP INDEX IF EXISTS "taleem-ai-base".idx_tenant_memberships_user_id;

ALTER TABLE "taleem-ai-base".tenant_memberships
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".tenant_memberships
  ADD CONSTRAINT fk_tenant_memberships_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".tenant_memberships
  ADD CONSTRAINT uq_tenant_membership UNIQUE (tenant_id, identity_id);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_identity_id
  ON "taleem-ai-base".tenant_memberships (identity_id);

-- 4b) user_roles -> identity_roles
ALTER TABLE "taleem-ai-base".user_roles
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".user_roles
SET identity_id = user_id
WHERE identity_id IS NULL;

DELETE FROM "taleem-ai-base".user_roles WHERE identity_id IS NULL;

ALTER TABLE "taleem-ai-base".user_roles
  ALTER COLUMN identity_id SET NOT NULL;

ALTER TABLE "taleem-ai-base".user_roles
  DROP CONSTRAINT IF EXISTS uq_user_role;

ALTER TABLE "taleem-ai-base".user_roles
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".user_roles
  RENAME TO identity_roles;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_pkey'
      AND conrelid = '"taleem-ai-base".identity_roles'::regclass
  ) THEN
    ALTER TABLE "taleem-ai-base".identity_roles
      RENAME CONSTRAINT user_roles_pkey TO identity_roles_pkey;
  END IF;
END $$;

ALTER TABLE "taleem-ai-base".identity_roles
  ADD CONSTRAINT fk_identity_roles_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".identity_roles
  ADD CONSTRAINT fk_identity_roles_granted_by
  FOREIGN KEY (granted_by) REFERENCES "taleem-ai-base".identities (id) ON DELETE SET NULL;

ALTER TABLE "taleem-ai-base".identity_roles
  ADD CONSTRAINT uq_identity_role UNIQUE (identity_id, role_id);

CREATE INDEX IF NOT EXISTS idx_identity_roles_identity_id
  ON "taleem-ai-base".identity_roles (identity_id);

-- 4c) user_tokens
ALTER TABLE "taleem-ai-base".user_tokens
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".user_tokens
SET identity_id = user_id
WHERE identity_id IS NULL;

DROP INDEX IF EXISTS "taleem-ai-base".idx_user_tokens_user_id;

ALTER TABLE "taleem-ai-base".user_tokens
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".user_tokens
  ADD CONSTRAINT fk_user_tokens_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".user_tokens
  ADD CONSTRAINT fk_user_tokens_invited_by
  FOREIGN KEY (invited_by) REFERENCES "taleem-ai-base".identities (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_tokens_identity_id
  ON "taleem-ai-base".user_tokens (identity_id)
  WHERE identity_id IS NOT NULL;

-- 4d) application_access_assignments (user_id + created_by/updated_by)
ALTER TABLE "taleem-ai-base".application_access_assignments
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".application_access_assignments
SET identity_id = user_id
WHERE identity_id IS NULL;

DELETE FROM "taleem-ai-base".application_access_assignments WHERE identity_id IS NULL;

ALTER TABLE "taleem-ai-base".application_access_assignments
  ALTER COLUMN identity_id SET NOT NULL;

ALTER TABLE "taleem-ai-base".application_access_assignments
  DROP CONSTRAINT IF EXISTS uq_application_access_assignment;

DROP INDEX IF EXISTS "taleem-ai-base".uq_app_access_default_per_member;
DROP INDEX IF EXISTS "taleem-ai-base".idx_app_access_user_id;

ALTER TABLE "taleem-ai-base".application_access_assignments
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".application_access_assignments
  ADD CONSTRAINT fk_app_access_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

ALTER TABLE "taleem-ai-base".application_access_assignments
  ADD CONSTRAINT fk_app_access_created_by
  FOREIGN KEY (created_by) REFERENCES "taleem-ai-base".identities (id) ON DELETE SET NULL;

ALTER TABLE "taleem-ai-base".application_access_assignments
  ADD CONSTRAINT fk_app_access_updated_by
  FOREIGN KEY (updated_by) REFERENCES "taleem-ai-base".identities (id) ON DELETE SET NULL;

ALTER TABLE "taleem-ai-base".application_access_assignments
  ADD CONSTRAINT uq_application_access_assignment
  UNIQUE (tenant_id, identity_id, application_id);

CREATE INDEX IF NOT EXISTS idx_app_access_identity_id
  ON "taleem-ai-base".application_access_assignments (identity_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_app_access_default_per_member
  ON "taleem-ai-base".application_access_assignments (tenant_id, identity_id)
  WHERE is_default = TRUE AND status = 'ACTIVE';

-- 4e) OAuth sessions
ALTER TABLE "taleem-ai-base".sessions
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".sessions
SET identity_id = user_id
WHERE identity_id IS NULL;

DELETE FROM "taleem-ai-base".sessions WHERE identity_id IS NULL;

ALTER TABLE "taleem-ai-base".sessions
  ALTER COLUMN identity_id SET NOT NULL;

DROP INDEX IF EXISTS "taleem-ai-base".idx_sessions_user_id;

ALTER TABLE "taleem-ai-base".sessions
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".sessions
  ADD CONSTRAINT fk_sessions_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sessions_identity_id
  ON "taleem-ai-base".sessions (identity_id);

-- 4f) OAuth authorization codes
ALTER TABLE "taleem-ai-base".authorization_codes
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".authorization_codes
SET identity_id = user_id
WHERE identity_id IS NULL;

DELETE FROM "taleem-ai-base".authorization_codes WHERE identity_id IS NULL;

ALTER TABLE "taleem-ai-base".authorization_codes
  ALTER COLUMN identity_id SET NOT NULL;

ALTER TABLE "taleem-ai-base".authorization_codes
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".authorization_codes
  ADD CONSTRAINT fk_authorization_codes_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_authorization_codes_identity_id
  ON "taleem-ai-base".authorization_codes (identity_id);

-- 4g) OAuth refresh token families
ALTER TABLE "taleem-ai-base".refresh_token_families
  ADD COLUMN IF NOT EXISTS identity_id UUID;

UPDATE "taleem-ai-base".refresh_token_families
SET identity_id = user_id
WHERE identity_id IS NULL;

DELETE FROM "taleem-ai-base".refresh_token_families WHERE identity_id IS NULL;

ALTER TABLE "taleem-ai-base".refresh_token_families
  ALTER COLUMN identity_id SET NOT NULL;

ALTER TABLE "taleem-ai-base".refresh_token_families
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE "taleem-ai-base".refresh_token_families
  ADD CONSTRAINT fk_refresh_token_families_identity
  FOREIGN KEY (identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_refresh_token_families_identity_id
  ON "taleem-ai-base".refresh_token_families (identity_id);

-- 4h) audit_events actor
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'taleem-ai-base'
      AND table_name = 'audit_events'
      AND column_name = 'actor_user_id'
  ) THEN
    ALTER TABLE "taleem-ai-base".audit_events
      RENAME COLUMN actor_user_id TO actor_identity_id;
  END IF;
END $$;

DROP INDEX IF EXISTS "taleem-ai-base".idx_audit_events_actor_user_id;

-- Actor rows may point at principals that were purged; keep them but null the link.
UPDATE "taleem-ai-base".audit_events a
SET actor_identity_id = NULL
WHERE a.actor_identity_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "taleem-ai-base".identities i WHERE i.id = a.actor_identity_id
  );

ALTER TABLE "taleem-ai-base".audit_events
  ADD CONSTRAINT fk_audit_events_actor_identity
  FOREIGN KEY (actor_identity_id) REFERENCES "taleem-ai-base".identities (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_identity_id
  ON "taleem-ai-base".audit_events (actor_identity_id);

-- ---------------------------------------------------------------------------
-- 5) Retire the legacy tables
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS "taleem-ai-base".user_identities;
DROP TABLE IF EXISTS "taleem-ai-base".users;
