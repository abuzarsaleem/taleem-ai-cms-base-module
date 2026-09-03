import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { IUserRefreshTokenRepository } from '../../domain/refresh-token.repository.interface.js';
import type { UserRefreshTokenProps } from '../../domain/refresh-token.types.js';
import { UserRefreshTokenEntity } from './refresh-token.entity.js';

@Injectable()
export class TypeOrmUserRefreshTokenRepository implements IUserRefreshTokenRepository {
  constructor(
    @InjectRepository(UserRefreshTokenEntity)
    private readonly repo: Repository<UserRefreshTokenEntity>,
  ) {}

  async create(props: UserRefreshTokenProps) {
    const saved = await this.repo.save(
      this.repo.create({
        userId: props.userId,
        tokenHash: props.tokenHash,
        expiresAt: props.expiresAt,
      }),
    );
    return this.map(saved);
  }

  async findValidByHash(tokenHash: string) {
    const row = await this.repo.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    return row ? this.map(row) : null;
  }

  async findByIdForUser(id: string, userId: string) {
    const row = await this.repo.findOne({ where: { id, userId, revokedAt: IsNull() } });
    return row ? this.map(row) : null;
  }

  async listActiveByUser(userId: string, page: number, limit: number) {
    const [rows, total] = await this.repo.findAndCount({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async revoke(id: string) {
    await this.repo.update({ id }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string) {
    await this.repo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private map(entity: UserRefreshTokenEntity): UserRefreshTokenProps {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    };
  }
}
