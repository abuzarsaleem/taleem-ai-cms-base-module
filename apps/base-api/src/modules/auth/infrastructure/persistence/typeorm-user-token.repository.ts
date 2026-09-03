import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { IUserTokenRepository } from '../../domain/user-token.repository.interface.js';
import {
  UserTokenStatus,
  UserTokenType,
  type UserTokenProps,
} from '../../domain/user-token.types.js';
import { UserTokenEntity } from './user-token.entity.js';

@Injectable()
export class TypeOrmUserTokenRepository implements IUserTokenRepository {
  constructor(
    @InjectRepository(UserTokenEntity)
    private readonly repo: Repository<UserTokenEntity>,
  ) {}

  async create(props: UserTokenProps) {
    const saved = await this.repo.save(
      this.repo.create({
        tokenType: props.tokenType,
        tokenHash: props.tokenHash,
        userId: props.userId,
        tenantId: props.tenantId,
        email: props.email?.toLowerCase(),
        membershipRole: props.membershipRole,
        status: props.status,
        expiresAt: props.expiresAt,
        invitedBy: props.invitedBy,
        ipAddress: props.ipAddress,
        metadata: props.metadata,
      }),
    );
    return this.map(saved);
  }

  async update(id: string, props: Partial<UserTokenProps>) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Token '${id}' not found`);
    }

    if (props.tokenHash !== undefined) existing.tokenHash = props.tokenHash;
    if (props.status !== undefined) existing.status = props.status;
    if (props.expiresAt !== undefined) existing.expiresAt = props.expiresAt;
    if (props.usedAt !== undefined) existing.usedAt = props.usedAt;
    if (props.revokedAt !== undefined) existing.revokedAt = props.revokedAt;
    if (props.membershipRole !== undefined) existing.membershipRole = props.membershipRole;
    if (props.email !== undefined) existing.email = props.email.toLowerCase();
    if (props.metadata !== undefined) existing.metadata = props.metadata;

    return this.map(await this.repo.save(existing));
  }

  async findValidByHash(tokenHash: string, tokenType: UserTokenType) {
    if (tokenType === UserTokenType.TENANT_INVITATION) {
      const row = await this.repo.findOne({
        where: {
          tokenHash,
          tokenType,
          status: UserTokenStatus.PENDING,
          usedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
      });
      return row ? this.map(row) : null;
    }

    if (tokenType === UserTokenType.REFRESH_TOKEN) {
      const row = await this.repo.findOne({
        where: {
          tokenHash,
          tokenType,
          revokedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
      });
      return row ? this.map(row) : null;
    }

    const row = await this.repo.findOne({
      where: {
        tokenHash,
        tokenType,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    return row ? this.map(row) : null;
  }

  async findByTokenHash(tokenHash: string) {
    const row = await this.repo.findOne({ where: { tokenHash } });
    return row ? this.map(row) : null;
  }

  async markUsed(id: string) {
    await this.repo.update({ id }, { usedAt: new Date() });
  }

  async revoke(id: string) {
    await this.repo.update({ id }, { revokedAt: new Date() });
  }

  async invalidatePendingForUser(userId: string, tokenType: UserTokenType) {
    if (tokenType === UserTokenType.TENANT_INVITATION) {
      await this.repo.update(
        { userId, tokenType, status: UserTokenStatus.PENDING, usedAt: IsNull() },
        { usedAt: new Date(), status: UserTokenStatus.CANCELLED },
      );
      return;
    }

    await this.repo.update(
      { userId, tokenType, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string, tokenType: UserTokenType) {
    await this.repo.update(
      { userId, tokenType, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async findByIdForUser(id: string, userId: string, tokenType: UserTokenType) {
    const row = await this.repo.findOne({
      where: { id, userId, tokenType, revokedAt: IsNull() },
    });
    return row ? this.map(row) : null;
  }

  async listActiveByUser(userId: string, tokenType: UserTokenType, page: number, limit: number) {
    const [rows, total] = await this.repo.findAndCount({
      where: {
        userId,
        tokenType,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async findInvitationsByTenant(
    tenantId: string,
    page: number,
    limit: number,
    membershipRole?: string,
  ) {
    const where = {
      tenantId,
      tokenType: UserTokenType.TENANT_INVITATION,
      ...(membershipRole ? { membershipRole } : {}),
    };
    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async findInvitationById(tenantId: string, id: string) {
    const row = await this.repo.findOne({
      where: { id, tenantId, tokenType: UserTokenType.TENANT_INVITATION },
    });
    return row ? this.map(row) : null;
  }

  async findPendingInvitationByEmail(tenantId: string, email: string, membershipRole?: string) {
    const row = await this.repo.findOne({
      where: {
        tenantId,
        email: email.toLowerCase(),
        tokenType: UserTokenType.TENANT_INVITATION,
        status: UserTokenStatus.PENDING,
        ...(membershipRole ? { membershipRole } : {}),
      },
    });
    return row ? this.map(row) : null;
  }

  private map(entity: UserTokenEntity): UserTokenProps {
    return {
      id: entity.id,
      tokenType: entity.tokenType as UserTokenType,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      tenantId: entity.tenantId,
      email: entity.email,
      membershipRole: entity.membershipRole,
      status: entity.status as UserTokenStatus | undefined,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      revokedAt: entity.revokedAt,
      invitedBy: entity.invitedBy,
      ipAddress: entity.ipAddress,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    };
  }
}
