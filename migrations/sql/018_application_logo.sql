-- Application catalog logo (object key or external URL)
ALTER TABLE "taleem-ai-base".applications
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(1000);
