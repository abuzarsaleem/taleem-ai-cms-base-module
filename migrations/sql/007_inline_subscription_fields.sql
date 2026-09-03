-- Store commercial fields on tenant subscriptions and drop the unused plan catalog

ALTER TABLE "taleem-ai-base".subscriptions
  ADD COLUMN plan_type VARCHAR(30),
  ADD COLUMN billing_cycle VARCHAR(30),
  ADD COLUMN application_codes JSONB NOT NULL DEFAULT '[]';

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

UPDATE "taleem-ai-base".subscriptions
SET plan_type = 'PAID'
WHERE plan_type IS NULL;

ALTER TABLE "taleem-ai-base".subscriptions
  ALTER COLUMN plan_type SET NOT NULL;

ALTER TABLE "taleem-ai-base".subscriptions
  ADD CONSTRAINT chk_subscription_plan_type
  CHECK (plan_type IN ('TRIAL', 'FREE', 'PAID'));

ALTER TABLE "taleem-ai-base".subscriptions
  ADD CONSTRAINT chk_subscription_billing_cycle
  CHECK (billing_cycle IS NULL OR billing_cycle IN ('MONTHLY', 'YEARLY'));

ALTER TABLE "taleem-ai-base".subscriptions
  DROP COLUMN plan_id;

DROP TABLE "taleem-ai-base".subscription_plans;
