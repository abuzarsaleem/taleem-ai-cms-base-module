-- Rename unified token table to `accounts`

ALTER TABLE "taleem-ai-base".user_tokens
  RENAME TO accounts;

ALTER INDEX "taleem-ai-base".idx_user_tokens_user_id
  RENAME TO idx_accounts_user_id;

ALTER INDEX "taleem-ai-base".idx_user_tokens_tenant_email
  RENAME TO idx_accounts_tenant_email;

ALTER INDEX "taleem-ai-base".idx_user_tokens_type
  RENAME TO idx_accounts_type;

ALTER INDEX "taleem-ai-base".idx_user_tokens_expires_at
  RENAME TO idx_accounts_expires_at;

