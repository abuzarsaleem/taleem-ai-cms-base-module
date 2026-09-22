-- Tracks automated subscription lifecycle actions (expiry warnings + auto-expiry)
-- so reminder emails are not sent twice for the same milestone.

CREATE TABLE IF NOT EXISTS "taleem-ai-base".subscription_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL
    REFERENCES "taleem-ai-base".subscriptions (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL
    REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  days_before INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_subscription_lifecycle_event_type
    CHECK (event_type IN ('EXPIRY_WARNING', 'EXPIRED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_lifecycle_warning
  ON "taleem-ai-base".subscription_lifecycle_events (subscription_id, event_type, days_before)
  WHERE event_type = 'EXPIRY_WARNING';

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_lifecycle_expired
  ON "taleem-ai-base".subscription_lifecycle_events (subscription_id, event_type)
  WHERE event_type = 'EXPIRED';

CREATE INDEX IF NOT EXISTS idx_subscription_lifecycle_subscription_id
  ON "taleem-ai-base".subscription_lifecycle_events (subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_lifecycle_created_at
  ON "taleem-ai-base".subscription_lifecycle_events (created_at DESC);
