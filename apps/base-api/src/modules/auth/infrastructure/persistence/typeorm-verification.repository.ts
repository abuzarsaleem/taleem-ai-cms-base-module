import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { IVerificationTokenRepository } from '../../domain/verification.repository.interface.js';
import type { VerificationTokenProps } from '../../domain/verification.types.js';
import { VerificationTokenType } from '../../domain/verification.types.js';
import { UserVerificationTokenEntity } from './verification.entity.js';

@Injectable()
export class TypeOrmVerificationTokenRepository implements IVerificationTokenRepository {
  constructor(
    @InjectRepository(UserVerificationTokenEntity)
    private readonly repo: Repository<UserVerificationTokenEntity>,
  ) {}

  async create(props: VerificationTokenProps) {
    const saved = await this.repo.save(
      this.repo.create({
        userId: props.userId,
        tokenType: props.tokenType,
        tokenHash: props.tokenHash,
        expiresAt: props.expiresAt,
        ipAddress: props.ipAddress,
      }),
    );
    return this.map(saved);
  }

  async findValidByHash(tokenHash: string, tokenType: VerificationTokenType) {
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

  async markUsed(id: string) {
    await this.repo.update({ id }, { usedAt: new Date() });
  }

  async invalidatePendingForUser(userId: string, tokenType: VerificationTokenType) {
    await this.repo.update(
      { userId, tokenType, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }

  private map(entity: UserVerificationTokenEntity): VerificationTokenProps {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenType: entity.tokenType as VerificationTokenType,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      ipAddress: entity.ipAddress,
      createdAt: entity.createdAt,
    };
  }
}
