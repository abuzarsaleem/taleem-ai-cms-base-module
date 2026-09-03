-- Revert: rename `accounts` back to `user_tokens`

ALTER TABLE "taleem-ai-base".accounts
  RENAME TO user_tokens;

ALTER INDEX "taleem-ai-base".idx_accounts_user_id
  RENAME TO idx_user_tokens_user_id;

ALTER INDEX "taleem-ai-base".idx_accounts_tenant_email
  RENAME TO idx_user_tokens_tenant_email;

ALTER INDEX "taleem-ai-base".idx_accounts_type
  RENAME TO idx_user_tokens_type;

ALTER INDEX "taleem-ai-base".idx_accounts_expires_at
  RENAME TO idx_user_tokens_expires_at;
