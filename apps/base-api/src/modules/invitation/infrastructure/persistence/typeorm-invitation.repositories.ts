import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TenantAdminInvitationProps } from '../../domain/invitation.types.js';
import {
  ITenantAdminInvitationRepository,
  ITenantAdministratorRepository,
  ITenantMembershipRepository,
  IUserIdentityRepository,
  type TenantAdministratorProps,
  type TenantMembershipProps,
  type UserIdentityProps,
} from '../../domain/invitation.repository.interface.js';
import { InvitationStatus } from '../../domain/invitation.types.js';
import {
  TenantAdminInvitationEntity,
  TenantAdministratorEntity,
  TenantMembershipEntity,
  UserIdentityEntity,
} from './invitation.entities.js';
import { UserEntity } from '../../../user/infrastructure/persistence/user.entity.js';

function notFound(resource: string, id: string): never {
  throw new NotFoundException(`${resource} '${id}' not found`);
}

@Injectable()
export class TypeOrmTenantAdminInvitationRepository implements ITenantAdminInvitationRepository {
  constructor(
    @InjectRepository(TenantAdminInvitationEntity)
    private readonly repo: Repository<TenantAdminInvitationEntity>,
  ) {}

  findByTenant(tenantId: string, page: number, limit: number) {
    return this.repo
      .findAndCount({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      })
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async findPendingByEmail(tenantId: string, email: string) {
    const row = await this.repo.findOne({
      where: { tenantId, email: email.toLowerCase(), status: InvitationStatus.PENDING },
    });
    return row ? this.map(row) : null;
  }

  async findByTokenHash(tokenHash: string) {
    const row = await this.repo.findOne({ where: { tokenHash } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantAdminInvitationProps) {
    return this.map(
      await this.repo.save(
        this.repo.create({
          tenantId: props.tenantId,
          email: props.email.toLowerCase(),
          firstName: props.firstName,
          lastName: props.lastName,
          tokenHash: props.tokenHash,
          status: props.status,
          expiresAt: props.expiresAt,
          invitedBy: props.invitedBy,
        }),
      ),
    );
  }

  async update(tenantId: string, id: string, props: Partial<TenantAdminInvitationProps>) {
    if (!(await this.findById(tenantId, id))) notFound('Invitation', id);
    await this.repo.update({ id, tenantId }, {
      firstName: props.firstName,
      lastName: props.lastName,
      tokenHash: props.tokenHash,
      status: props.status,
      expiresAt: props.expiresAt,
      acceptedAt: props.acceptedAt,
    });
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  private map(e: TenantAdminInvitationEntity): TenantAdminInvitationProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      email: e.email,
      firstName: e.firstName,
      lastName: e.lastName,
      tokenHash: e.tokenHash,
      status: e.status as InvitationStatus,
      expiresAt: e.expiresAt,
      acceptedAt: e.acceptedAt,
      invitedBy: e.invitedBy,
      createdAt: e.createdAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantMembershipRepository implements ITenantMembershipRepository {
  constructor(
    @InjectRepository(TenantMembershipEntity)
    private readonly repo: Repository<TenantMembershipEntity>,
  ) {}

  async findByTenantAndUser(tenantId: string, userId: string) {
    const row = await this.repo.findOne({ where: { tenantId, userId } });
    return row ? this.map(row) : null;
  }

  async upsertActive(tenantId: string, userId: string) {
    const existing = await this.repo.findOne({ where: { tenantId, userId } });
    if (existing) {
      await this.repo.update({ id: existing.id }, { status: 'ACTIVE', updatedAt: new Date() });
      return this.map(await this.repo.findOneOrFail({ where: { id: existing.id } }));
    }
    return this.map(await this.repo.save(this.repo.create({ tenantId, userId, status: 'ACTIVE' })));
  }

  private map(e: TenantMembershipEntity): TenantMembershipProps {
    return { id: e.id, tenantId: e.tenantId, userId: e.userId, status: e.status };
  }
}

@Injectable()
export class TypeOrmTenantAdministratorRepository implements ITenantAdministratorRepository {
  constructor(
    @InjectRepository(TenantAdministratorEntity)
    private readonly adminRepo: Repository<TenantAdministratorEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findActiveByTenantAndUser(tenantId: string, userId: string) {
    const row = await this.adminRepo.findOne({
      where: { tenantId, userId, status: 'ACTIVE' },
    });
    return row ? this.map(row) : null;
  }

  async findActiveByTenantAndEmail(tenantId: string, email: string) {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return null;
    return this.findActiveByTenantAndUser(tenantId, user.id);
  }

  async upsertActive(tenantId: string, userId: string, assignedBy: string) {
    const existing = await this.adminRepo.findOne({ where: { tenantId, userId } });
    if (existing) {
      existing.status = 'ACTIVE';
      existing.assignedBy = assignedBy;
      existing.revokedAt = undefined;
      existing.revokedBy = undefined;
      return this.map(await this.adminRepo.save(existing));
    }
    return this.map(
      await this.adminRepo.save(
        this.adminRepo.create({ tenantId, userId, status: 'ACTIVE', assignedBy }),
      ),
    );
  }

  private map(e: TenantAdministratorEntity): TenantAdministratorProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      userId: e.userId,
      status: e.status,
      assignedBy: e.assignedBy,
    };
  }
}

@Injectable()
export class TypeOrmUserIdentityRepository implements IUserIdentityRepository {
  constructor(
    @InjectRepository(UserIdentityEntity)
    private readonly repo: Repository<UserIdentityEntity>,
  ) {}

  async findLocalByUserId(userId: string) {
    const row = await this.repo.findOne({ where: { userId, providerType: 'LOCAL' } });
    return row ? this.map(row) : null;
  }

  async createLocal(userId: string, email: string) {
    return this.map(
      await this.repo.save(
        this.repo.create({
          userId,
          providerType: 'LOCAL',
          identifier: email.toLowerCase(),
          isPrimary: true,
        }),
      ),
    );
  }

  private map(e: UserIdentityEntity): UserIdentityProps {
    return {
      id: e.id,
      userId: e.userId,
      providerType: e.providerType,
      identifier: e.identifier,
      isPrimary: e.isPrimary,
    };
  }
}
