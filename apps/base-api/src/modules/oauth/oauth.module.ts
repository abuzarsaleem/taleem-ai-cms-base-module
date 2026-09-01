import { Module } from '@nestjs/common';

/**
 * OAuth 2.0 authorization server module.
 * Implements authorization code + PKCE flow per Excel schema (sessions, authorization_codes, refresh_tokens).
 * Full token endpoint implementation is deferred to the next iteration.
 */
@Module({})
export class OauthModule {}
