import type { VerificationTokenProps, VerificationTokenType } from './verification.types.js';

export const VERIFICATION_TOKEN_REPOSITORY = Symbol('VERIFICATION_TOKEN_REPOSITORY');

export interface IVerificationTokenRepository {
  create(props: VerificationTokenProps): Promise<VerificationTokenProps>;
  findValidByHash(
    tokenHash: string,
    tokenType: VerificationTokenType,
  ): Promise<VerificationTokenProps | null>;
  markUsed(id: string): Promise<void>;
  invalidatePendingForUser(userId: string, tokenType: VerificationTokenType): Promise<void>;
}
