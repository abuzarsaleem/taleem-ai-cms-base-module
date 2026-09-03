-- Store commercial fields on tenant subscriptions and drop the unused plan catalog

ALTER TABLE "taleem-ai-base".subscriptions
  ADD COLUMN IF NOT EXISTS plan_type VARCHAR(30);

ALTER TABLE "taleem-ai-base".subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(30);

ALTER TABLE "taleem-ai-base".subscriptions
  ADD COLUMN IF NOT EXISTS application_codes JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'taleem-ai-base'
      AND table_name = 'subscription_plans'
  ) THEN
    UPDATE "taleem-ai-base".subscriptions s
    SET
      plan_type = COALESCE(p.plan_type, 'PAID'),
      billing_cycle = p.billing_cycle,
      application_codes = CASE
        WHEN jsonb_typeof(p.limits -> 'applicationCodes') = 'array' THEN p.limits -> 'applicationCodes'
        ELSE '[]'::jsonb
      END
    FROM "taleem-ai-base".subscription_plans p
    WHERE s.plan_id = p.id;
  END IF;
END $$;

UPDATE "taleem-ai-base".subscriptions
SET plan_type = 'PAID'
WHERE plan_type IS NULL;

ALTER TABLE "taleem-ai-base".subscriptions
  ALTER COLUMN plan_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subscription_plan_type'
  ) THEN
    ALTER TABLE "taleem-ai-base".subscriptions
      ADD CONSTRAINT chk_subscription_plan_type
      CHECK (plan_type IN ('TRIAL', 'FREE', 'PAID'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subscription_billing_cycle'
  ) THEN
    ALTER TABLE "taleem-ai-base".subscriptions
      ADD CONSTRAINT chk_subscription_billing_cycle
      CHECK (billing_cycle IS NULL OR billing_cycle IN ('MONTHLY', 'YEARLY'));
  END IF;
END $$;

ALTER TABLE "taleem-ai-base".subscriptions
  DROP COLUMN IF EXISTS plan_id;

DROP TABLE IF EXISTS "taleem-ai-base".subscription_plans;
