import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/user.repository.interface.js';
import { UserProps, UserListFilters } from '../../domain/user.types.js';
import { UserEntity } from './user.entity.js';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserProps | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<UserProps | null> {
    const entity = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(page: number, limit: number, filters?: UserListFilters) {
    const qb = this.repository.createQueryBuilder('user').orderBy('user.created_at', 'DESC');

    if (filters?.email) {
      qb.andWhere('user.email ILIKE :email', { email: `%${filters.email.toLowerCase()}%` });
    }
    if (filters?.status) {
      qb.andWhere('user.status = :status', { status: filters.status });
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: rows.map((row) => this.toDomain(row)), total };
  }

  async create(props: UserProps): Promise<UserProps> {
    const entity = this.repository.create({
      email: props.email.toLowerCase(),
      passwordHash: props.passwordHash,
      emailVerified: props.emailVerified ?? false,
      fullName: props.fullName,
      status: props.status,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, props: Partial<UserProps>): Promise<UserProps> {
    const patch: Record<string, unknown> = {};
    if (props.email !== undefined) patch.email = props.email.toLowerCase();
    if (props.passwordHash !== undefined) patch.passwordHash = props.passwordHash;
    if (props.emailVerified !== undefined) patch.emailVerified = props.emailVerified;
    if (props.fullName !== undefined) patch.fullName = props.fullName;
    if (props.avatarUrl !== undefined) patch.avatarUrl = props.avatarUrl;
    if (props.status !== undefined) patch.status = props.status;

    await this.repository.update(id, patch);
    const updated = await this.repository.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLoginAt: new Date() });
  }

  private toDomain(entity: UserEntity): UserProps {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      emailVerified: entity.emailVerified,
      fullName: entity.fullName,
      avatarUrl: entity.avatarUrl,
      status: entity.status,
      lastLoginAt: entity.lastLoginAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
