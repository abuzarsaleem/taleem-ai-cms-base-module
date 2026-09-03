import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import {
  OAUTH_SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  type IOAuthSessionRepository,
  type IRefreshTokenRepository,
} from '../../oauth/domain/oauth.repository.interface.js';
import { USER_REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.interface.js';
import type { IUserRefreshTokenRepository } from '../domain/refresh-token.repository.interface.js';

@Injectable()
export class UserSessionService {
  constructor(
    @Inject(USER_REFRESH_TOKEN_REPOSITORY)
    private readonly platformRefreshRepo: IUserRefreshTokenRepository,
    @Inject(OAUTH_SESSION_REPOSITORY)
    private readonly oauthSessionRepo: IOAuthSessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly oauthRefreshRepo: IRefreshTokenRepository,
  ) {}

  async list(userId: string, page: number, limit: number) {
    const [platform, oauth] = await Promise.all([
      this.platformRefreshRepo.listActiveByUser(userId, 1, 1000),
      this.oauthSessionRepo.listByUser(userId, 1, 1000),
    ]);

    const sessions = [
      ...platform.data.map((token) => ({
        id: `platform:${token.id}`,
        type: 'PLATFORM' as const,
        status: 'ACTIVE',
        clientName: 'Platform Login',
        createdAt: token.createdAt ?? new Date(),
        expiresAt: token.expiresAt,
      })),
      ...oauth.data.map((session) => ({
        id: `oauth:${session.id}`,
        type: 'OAUTH' as const,
        status: session.status,
        clientName: session.clientName ?? 'OAuth Application',
        tenantId: session.tenantId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt ?? new Date(),
        expiresAt: session.expiresAt,
        lastActivityAt: session.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * limit;
    const data = sessions.slice(start, start + limit);
    return paginatedResponse(data, sessions.length, page, limit);
  }

  async revoke(userId: string, sessionRef: string) {
    const colonIdx = sessionRef.indexOf(':');
    if (colonIdx === -1) {
      throw new NotFoundException('Session not found');
    }
    const type = sessionRef.slice(0, colonIdx);
    const id = sessionRef.slice(colonIdx + 1);
    if (type === 'platform') {
      const token = await this.platformRefreshRepo.findByIdForUser(id, userId);
      if (!token?.id) throw new NotFoundException('Session not found');
      await this.platformRefreshRepo.revoke(token.id);
      return { revoked: true };
    }

    if (type === 'oauth') {
      const session = await this.oauthSessionRepo.findByIdForUser(id, userId);
      if (!session?.id) throw new NotFoundException('Session not found');
      await this.oauthSessionRepo.revoke(session.id, 'user_revoked');
      await this.oauthRefreshRepo.revokeFamiliesBySessionId(session.id, 'user_revoked');
      return { revoked: true };
    }

    throw new NotFoundException('Session not found');
  }

  async revokeAll(userId: string) {
    const platform = await this.platformRefreshRepo.listActiveByUser(userId, 1, 1000);
    for (const token of platform.data) {
      if (token.id) await this.platformRefreshRepo.revoke(token.id);
    }

    const oauth = await this.oauthSessionRepo.listByUser(userId, 1, 1000);
    for (const session of oauth.data) {
      if (session.status !== 'ACTIVE' || !session.id) continue;
      await this.oauthSessionRepo.revoke(session.id, 'user_revoked_all');
      await this.oauthRefreshRepo.revokeFamiliesBySessionId(session.id, 'user_revoked_all');
    }

    return { revokedCount: platform.data.length + oauth.data.filter((s) => s.status === 'ACTIVE').length };
  }
}
