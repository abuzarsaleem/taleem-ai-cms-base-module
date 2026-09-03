import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { DATABASE_SCHEMA } from '@app/common';
import type {
  ApplicationScopeProps,
  AuthorizationCodeProps,
  OAuthAuditEventProps,
  OAuthClientProps,
  OAuthSessionProps,
  RefreshTokenFamilyProps,
  RefreshTokenProps,
  StoredAuthorizationCode,
  StoredRefreshToken,
} from '../../domain/oauth.repository.interface.js';
import {
  IApplicationScopeRepository,
  IAuthorizationCodeRepository,
  IOAuthAuditRepository,
  IOAuthClientRepository,
  IOAuthSessionRepository,
  IRefreshTokenRepository,
} from '../../domain/oauth.repository.interface.js';
import {
  APPLICATION_SCOPE_REPOSITORY,
  AUTHORIZATION_CODE_REPOSITORY,
  OAUTH_AUDIT_REPOSITORY,
  OAUTH_CLIENT_REPOSITORY,
  OAUTH_SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/oauth.repository.interface.js';
import {
  ApplicationScopeEntity,
  AuditEventEntity,
  AuthorizationCodeEntity,
  OAuthClientEntity,
  OAuthSessionEntity,
  RefreshTokenEntity,
  RefreshTokenFamilyEntity,
} from './oauth.entities.js';

@Injectable()
export class TypeOrmOAuthClientRepository implements IOAuthClientRepository {
  constructor(@InjectRepository(OAuthClientEntity) private readonly repo: Repository<OAuthClientEntity>) {}

  async findByClientId(clientId: string) {
    const row = await this.repo.findOne({ where: { clientId } });
    return row ? this.map(row) : null;
  }

  async findById(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.map(row) : null;
  }

  findByTenant(_tenantId: string, page: number, limit: number) {
    return this.list(page, limit);
  }

  list(page: number, limit: number) {
    return this.repo
      .findAndCount({ skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' } })
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async create(props: Omit<OAuthClientProps, 'id'> & { clientSecretHash?: string }) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  private map(e: OAuthClientEntity): OAuthClientProps {
    return {
      id: e.id,
      applicationId: e.applicationId,
      clientId: e.clientId,
      clientName: e.clientName,
      clientType: e.clientType,
      clientSecretHash: e.clientSecretHash,
      status: e.status,
      redirectUris: e.redirectUris ?? [],
    };
  }
}

@Injectable()
export class TypeOrmApplicationScopeRepository implements IApplicationScopeRepository {
  constructor(
    @InjectRepository(ApplicationScopeEntity)
    private readonly repo: Repository<ApplicationScopeEntity>,
  ) {}

  findActiveByApplication(applicationId: string) {
    return this.repo
      .find({ where: { applicationId, isActive: true }, order: { scopeCode: 'ASC' } })
      .then((rows) => rows.map((row) => this.map(row)));
  }

  async validateScopes(applicationId: string, scopes: string[]) {
    if (scopes.length === 0) return true;
    const active = await this.findActiveByApplication(applicationId);
    const allowed = new Set(active.map((s) => s.scopeCode));
    return scopes.every((scope) => allowed.has(scope));
  }

  private map(e: ApplicationScopeEntity): ApplicationScopeProps {
    return {
      id: e.id,
      applicationId: e.applicationId,
      scopeCode: e.scopeCode,
      name: e.name,
      description: e.description,
      isActive: e.isActive,
    };
  }
}

@Injectable()
export class TypeOrmAuthorizationCodeRepository implements IAuthorizationCodeRepository {
  constructor(
    @InjectRepository(AuthorizationCodeEntity)
    private readonly repo: Repository<AuthorizationCodeEntity>,
  ) {}

  async create(props: AuthorizationCodeProps) {
    const saved = await this.repo.save(this.repo.create(props));
    return this.map(saved);
  }

  async findByCodeHash(codeHash: string) {
    const row = await this.repo.findOne({ where: { codeHash } });
    return row ? this.map(row) : null;
  }

  async markUsed(id: string) {
    await this.repo.update({ id }, { usedAt: new Date() });
  }

  private map(e: AuthorizationCodeEntity): StoredAuthorizationCode {
    return {
      id: e.id,
      codeHash: e.codeHash,
      clientId: e.clientId,
      userId: e.userId,
      tenantId: e.tenantId,
      redirectUri: e.redirectUri,
      codeChallenge: e.codeChallenge,
      codeChallengeMethod: e.codeChallengeMethod,
      scope: e.scope,
      expiresAt: e.expiresAt,
      usedAt: e.usedAt,
    };
  }
}

@Injectable()
export class TypeOrmOAuthSessionRepository implements IOAuthSessionRepository {
  constructor(@InjectRepository(OAuthSessionEntity) private readonly repo: Repository<OAuthSessionEntity>) {}

  async create(props: OAuthSessionProps) {
    const saved = await this.repo.save(
      this.repo.create({
        ...props,
        sessionId: props.sessionId || randomUUID(),
        lastActivityAt: new Date(),
      }),
    );
    return { ...this.map(saved), id: saved.id };
  }

  async findBySessionId(sessionId: string) {
    const row = await this.repo.findOne({ where: { sessionId } });
    return row ? { ...this.map(row), id: row.id } : null;
  }

  async findActiveForGrant(userId: string, clientId: string, tenantId?: string) {
    const row = await this.repo.findOne({
      where: {
        userId,
        clientId,
        tenantId,
        status: 'ACTIVE',
      },
      order: { createdAt: 'DESC' },
    });
    return row ? { ...this.map(row), id: row.id } : null;
  }

  async revoke(id: string, reason?: string) {
    await this.repo.update(
      { id },
      { status: 'REVOKED', revokedAt: new Date(), revocationReason: reason },
    );
  }

  async findByIdForUser(id: string, userId: string) {
    const row = await this.repo.findOne({ where: { id, userId } });
    return row ? { ...this.map(row), id: row.id } : null;
  }

  async listByUser(userId: string, page: number, limit: number) {
    const qb = this.repo
      .createQueryBuilder('session')
      .leftJoin(OAuthClientEntity, 'client', 'client.id = session.client_id')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.status = :status', { status: 'ACTIVE' })
      .andWhere('session.expires_at > :now', { now: new Date() })
      .orderBy('session.last_activity_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .select([
        'session.id AS id',
        'session.session_id AS session_id',
        'session.user_id AS user_id',
        'session.tenant_id AS tenant_id',
        'session.client_id AS client_id',
        'session.status AS status',
        'session.expires_at AS expires_at',
        'session.ip_address AS ip_address',
        'session.user_agent AS user_agent',
        'session.created_at AS created_at',
        'client.client_name AS client_name',
      ]);

    const rows = await qb.getRawMany();
    const total = await this.repo.count({
      where: { userId, status: 'ACTIVE' },
    });

    return {
      data: rows.map((row) => ({
        id: String(row.id),
        sessionId: String(row.session_id),
        userId: String(row.user_id),
        tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
        clientId: String(row.client_id),
        status: String(row.status),
        expiresAt: row.expires_at as Date,
        ipAddress: row.ip_address ? String(row.ip_address) : undefined,
        userAgent: row.user_agent ? String(row.user_agent) : undefined,
        createdAt: row.created_at as Date,
        clientName: row.client_name ? String(row.client_name) : undefined,
      })),
      total,
    };
  }

  private map(e: OAuthSessionEntity): OAuthSessionProps {
    return {
      id: e.id,
      sessionId: e.sessionId,
      userId: e.userId,
      tenantId: e.tenantId,
      clientId: e.clientId,
      status: e.status,
      expiresAt: e.expiresAt,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
    };
  }
}

@Injectable()
export class TypeOrmRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenFamilyEntity)
    private readonly familyRepo: Repository<RefreshTokenFamilyEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepo: Repository<RefreshTokenEntity>,
  ) {}

  async createFamily(props: RefreshTokenFamilyProps) {
    const saved = await this.familyRepo.save(this.familyRepo.create(props));
    return { ...props, id: saved.id };
  }

  async createToken(props: RefreshTokenProps) {
    const saved = await this.tokenRepo.save(this.tokenRepo.create(props));
    const family = await this.familyRepo.findOneOrFail({ where: { id: props.familyId } });
    const session = await this.tokenRepo.manager
      .getRepository(OAuthSessionEntity)
      .findOne({ where: { id: family.sessionId } });
    return {
      id: saved.id,
      familyId: saved.familyId,
      tokenHash: saved.tokenHash,
      expiresAt: saved.expiresAt,
      usedAt: saved.usedAt,
      revokedAt: saved.revokedAt,
      familyStatus: family.status,
      sessionId: family.sessionId,
      userId: family.userId,
      tenantId: family.tenantId,
      clientId: session?.clientId ?? '',
      scope: '',
      email: '',
    } satisfies StoredRefreshToken;
  }

  async findByTokenHash(tokenHash: string) {
    const schema = `"${DATABASE_SCHEMA}"`;
    const rows = await this.tokenRepo.manager.query(
      `
      SELECT
        rt.id,
        rt.family_id,
        rt.token_hash,
        rt.expires_at,
        rt.used_at,
        rt.revoked_at,
        rf.status AS family_status,
        rf.session_id,
        rf.user_id,
        rf.tenant_id,
        s.client_id,
        ac.scope,
        u.email
      FROM ${schema}.refresh_tokens rt
      INNER JOIN ${schema}.refresh_token_families rf ON rf.id = rt.family_id
      INNER JOIN ${schema}.sessions s ON s.id = rf.session_id
      LEFT JOIN LATERAL (
        SELECT scope FROM ${schema}.authorization_codes
        WHERE client_id = s.client_id AND user_id = rf.user_id
        ORDER BY created_at DESC LIMIT 1
      ) ac ON true
      INNER JOIN ${schema}.users u ON u.id = rf.user_id
      WHERE rt.token_hash = $1
      `,
      [tokenHash],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      familyId: String(row.family_id),
      tokenHash: String(row.token_hash),
      expiresAt: row.expires_at as Date,
      usedAt: row.used_at as Date | undefined,
      revokedAt: row.revoked_at as Date | undefined,
      familyStatus: String(row.family_status),
      sessionId: String(row.session_id),
      userId: String(row.user_id),
      tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
      clientId: String(row.client_id),
      scope: String(row.scope ?? 'openid profile'),
      email: String(row.email),
    } satisfies StoredRefreshToken;
  }

  async markUsed(id: string, replacedById?: string) {
    await this.tokenRepo.update({ id }, { usedAt: new Date(), replacedById });
  }

  async revokeFamily(familyId: string, status: string, reason?: string) {
    await this.familyRepo.update(
      { id: familyId },
      { status, revokedAt: new Date(), revocationReason: reason },
    );
  }

  async revokeToken(id: string) {
    await this.tokenRepo.update({ id }, { revokedAt: new Date() });
  }

  async revokeFamiliesBySessionId(sessionId: string, reason?: string) {
    const families = await this.familyRepo.find({ where: { sessionId } });
    for (const family of families) {
      await this.revokeFamily(family.id, 'REVOKED', reason);
    }
  }
}

@Injectable()
export class TypeOrmOAuthAuditRepository implements IOAuthAuditRepository {
  constructor(@InjectRepository(AuditEventEntity) private readonly repo: Repository<AuditEventEntity>) {}

  async create(props: OAuthAuditEventProps) {
    await this.repo.save(this.repo.create(props));
  }
}

export const oauthRepositories = [
  { provide: OAUTH_CLIENT_REPOSITORY, useClass: TypeOrmOAuthClientRepository },
  { provide: APPLICATION_SCOPE_REPOSITORY, useClass: TypeOrmApplicationScopeRepository },
  { provide: AUTHORIZATION_CODE_REPOSITORY, useClass: TypeOrmAuthorizationCodeRepository },
  { provide: OAUTH_SESSION_REPOSITORY, useClass: TypeOrmOAuthSessionRepository },
  { provide: REFRESH_TOKEN_REPOSITORY, useClass: TypeOrmRefreshTokenRepository },
  { provide: OAUTH_AUDIT_REPOSITORY, useClass: TypeOrmOAuthAuditRepository },
];
