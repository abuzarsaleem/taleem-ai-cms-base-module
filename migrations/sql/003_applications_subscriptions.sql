-- Applications, subscriptions, and entitlements

CREATE TABLE "taleem-ai-base".applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  version VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  launch_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_applications_status ON "taleem-ai-base".applications (status);

CREATE TABLE "taleem-ai-base".subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(50) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(30) NOT NULL,
  billing_cycle VARCHAR(30),
  price NUMERIC(10, 2) DEFAULT 0,
  trial_days INT,
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT chk_plan_type CHECK (plan_type IN ('TRIAL', 'FREE', 'PAID')),
  CONSTRAINT chk_billing_cycle CHECK (
    billing_cycle IS NULL OR billing_cycle IN ('MONTHLY', 'YEARLY')
  ),
  CONSTRAINT chk_trial_days CHECK (
    trial_days IS NULL OR plan_type = 'TRIAL'
  )
);

CREATE TABLE "taleem-ai-base".subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  plan_id UUID REFERENCES "taleem-ai-base".subscription_plans (id),
  subscription_code VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_tenant_id ON "taleem-ai-base".subscriptions (tenant_id);
CREATE INDEX idx_subscriptions_status ON "taleem-ai-base".subscriptions (status);

CREATE TABLE "taleem-ai-base".tenant_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES "taleem-ai-base".applications (id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES "taleem-ai-base".subscriptions (id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_entitlements_tenant_id ON "taleem-ai-base".tenant_entitlements (tenant_id);
CREATE INDEX idx_tenant_entitlements_application_id ON "taleem-ai-base".tenant_entitlements (application_id);
CREATE INDEX idx_tenant_entitlements_status ON "taleem-ai-base".tenant_entitlements (status);

CREATE TABLE "taleem-ai-base".tenant_administrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "taleem-ai-base".tenants (id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  CONSTRAINT uq_tenant_administrator UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_administrators_tenant_id ON "taleem-ai-base".tenant_administrators (tenant_id);
CREATE INDEX idx_tenant_administrators_user_id ON "taleem-ai-base".tenant_administrators (user_id);
