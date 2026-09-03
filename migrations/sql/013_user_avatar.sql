-- User profile picture (storage object key; URL resolved at read time)

ALTER TABLE "taleem-ai-base".users
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000);
