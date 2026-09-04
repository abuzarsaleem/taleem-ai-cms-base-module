import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import { MembershipRole, MembershipStatus } from '../../domain/membership.types.js';
import {
  ITenantMembershipRepository,
  IUserIdentityRepository,
  type TenantMembershipDetailProps,
  type TenantMembershipProps,
  type UserIdentityProps,
  type UserTenantMembershipProps,
} from '../../domain/invitation.repository.interface.js';
import {
  TenantMembershipEntity,
  UserIdentityEntity,
} from './invitation.entities.js';
import { UserEntity } from '../../../user/infrastructure/persistence/user.entity.js';

function notFound(resource: string, id: string): never {
  throw new NotFoundException(`${resource} '${id}' not found`);
}

function isAdminRole(role: string | undefined): boolean {
  return role === MembershipRole.ADMIN;
}

@Injectable()
export class TypeOrmTenantMembershipRepository implements ITenantMembershipRepository {
  constructor(
    @InjectRepository(TenantMembershipEntity)
    private readonly repo: Repository<TenantMembershipEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findByTenant(tenantId: string, page: number, limit: number) {
    const rows = await this.repo.manager.query(
      `
      SELECT
        m.id,
        m.tenant_id,
        m.user_id,
        m.status,
        m.role,
        m.joined_at,
        m.created_at,
        m.updated_at,
        u.email AS user_email,
        u.full_name AS user_full_name
      FROM "${DATABASE_SCHEMA}".tenant_memberships m
      INNER JOIN "${DATABASE_SCHEMA}".users u ON u.id = m.user_id
      WHERE m.tenant_id = $1
      ORDER BY m.joined_at DESC
      LIMIT $2 OFFSET $3
      `,
      [tenantId, limit, (page - 1) * limit],
    );

    const [{ count }] = await this.repo.manager.query(
      `SELECT COUNT(*)::int AS count FROM "${DATABASE_SCHEMA}".tenant_memberships WHERE tenant_id = $1`,
      [tenantId],
    );

    return {
      data: rows.map((row: Record<string, unknown>) => this.mapDetailRow(row)),
      total: Number(count),
    };
  }

  async findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      userId?: string;
      status?: string;
      role?: string;
      email?: string;
    },
  ) {
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters?.tenantId) {
      params.push(filters.tenantId);
      where.push(`m.tenant_id = $${params.length}`);
    }
    if (filters?.userId) {
      params.push(filters.userId);
      where.push(`m.user_id = $${params.length}`);
    }
    if (filters?.status) {
      params.push(filters.status);
      where.push(`m.status = $${params.length}`);
    }
    if (filters?.role) {
      params.push(filters.role);
      where.push(`m.role = $${params.length}`);
    }
    if (filters?.email) {
      params.push(`%${filters.email.toLowerCase()}%`);
      where.push(`LOWER(u.email) LIKE $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit, (page - 1) * limit);

    const rows = await this.repo.manager.query(
      `
      SELECT
        m.id,
        m.tenant_id,
        m.user_id,
        m.status,
        m.role,
        m.joined_at,
        m.created_at,
        m.updated_at,
        u.email AS user_email,
        u.full_name AS user_full_name
      FROM "${DATABASE_SCHEMA}".tenant_memberships m
      INNER JOIN "${DATABASE_SCHEMA}".users u ON u.id = m.user_id
      ${whereSql}
      ORDER BY m.joined_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params,
    );

    const countParams = params.slice(0, -2);
    const [{ count }] = await this.repo.manager.query(
      `
      SELECT COUNT(*)::int AS count
      FROM "${DATABASE_SCHEMA}".tenant_memberships m
      INNER JOIN "${DATABASE_SCHEMA}".users u ON u.id = m.user_id
      ${whereSql}
      `,
      countParams,
    );

    return {
      data: rows.map((row: Record<string, unknown>) => this.mapDetailRow(row)),
      total: Number(count),
    };
  }

  async findById(tenantId: string, id: string) {
    const rows = await this.repo.manager.query(
      `
      SELECT
        m.id,
        m.tenant_id,
        m.user_id,
        m.status,
        m.role,
        m.joined_at,
        m.created_at,
        m.updated_at,
        u.email AS user_email,
        u.full_name AS user_full_name
      FROM "${DATABASE_SCHEMA}".tenant_memberships m
      INNER JOIN "${DATABASE_SCHEMA}".users u ON u.id = m.user_id
      WHERE m.id = $1 AND m.tenant_id = $2
      `,
      [id, tenantId],
    );
    return rows[0] ? this.mapDetailRow(rows[0]) : null;
  }

  async findByUser(userId: string, page: number, limit: number) {
    const rows = await this.repo.manager.query(
      `
      SELECT
        m.id AS membership_id,
        m.tenant_id,
        t.tenant_code,
        t.display_name AS tenant_display_name,
        t.status AS tenant_status,
        m.status AS membership_status,
        m.role,
        m.joined_at
      FROM "${DATABASE_SCHEMA}".tenant_memberships m
      INNER JOIN "${DATABASE_SCHEMA}".tenants t ON t.id = m.tenant_id
      WHERE m.user_id = $1
      ORDER BY m.joined_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, (page - 1) * limit],
    );

    const [{ count }] = await this.repo.manager.query(
      `SELECT COUNT(*)::int AS count FROM "${DATABASE_SCHEMA}".tenant_memberships WHERE user_id = $1`,
      [userId],
    );

    return {
      data: rows.map((row: Record<string, unknown>) => this.mapUserTenantRow(row)),
      total: Number(count),
    };
  }

  async findByTenantAndUser(tenantId: string, userId: string) {
    const row = await this.repo.findOne({ where: { tenantId, userId } });
    return row ? this.map(row) : null;
  }

  async findActiveAdminByEmail(tenantId: string, email: string) {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return null;
    const row = await this.repo.findOne({
      where: {
        tenantId,
        userId: user.id,
        status: MembershipStatus.ACTIVE,
        role: MembershipRole.ADMIN,
      },
    });
    return row ? this.map(row) : null;
  }

  countActiveAdmins(tenantId: string) {
    return this.repo.count({
      where: { tenantId, status: MembershipStatus.ACTIVE, role: MembershipRole.ADMIN },
    });
  }

  async upsertActive(tenantId: string, userId: string, role: string = MembershipRole.MEMBER) {
    const existing = await this.repo.findOne({ where: { tenantId, userId } });
    if (existing) {
      await this.repo.update(
        { id: existing.id },
        { status: MembershipStatus.ACTIVE, role, updatedAt: new Date() },
      );
      return this.map(await this.repo.findOneOrFail({ where: { id: existing.id } }));
    }
    return this.map(
      await this.repo.save(
        this.repo.create({
          tenantId,
          userId,
          status: MembershipStatus.ACTIVE,
          role,
        }),
      ),
    );
  }

  async updateRole(tenantId: string, userId: string, role: string) {
    const existing = await this.repo.findOne({ where: { tenantId, userId } });
    if (!existing) notFound('Membership', `${tenantId}/${userId}`);
    await this.repo.update({ id: existing.id }, { role, updatedAt: new Date() });
    return this.map(await this.repo.findOneOrFail({ where: { id: existing.id } }));
  }

  async updateStatus(tenantId: string, id: string, status: MembershipStatus) {
    if (!(await this.repo.findOne({ where: { id, tenantId } }))) {
      notFound('Membership', id);
    }
    await this.repo.update({ id, tenantId }, { status, updatedAt: new Date() });
    return (await this.findById(tenantId, id))!;
  }

  async delete(tenantId: string, id: string) {
    const result = await this.repo.delete({ id, tenantId });
    if (!result.affected) notFound('Membership', id);
  }

  private mapDetailRow(row: Record<string, unknown>): TenantMembershipDetailProps {
    const role = String(row.role ?? MembershipRole.MEMBER);
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      userId: String(row.user_id),
      status: String(row.status),
      role,
      joinedAt: row.joined_at as Date,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      userEmail: String(row.user_email),
      userFullName: String(row.user_full_name),
      isTenantAdmin: isAdminRole(role),
    };
  }

  private mapUserTenantRow(row: Record<string, unknown>): UserTenantMembershipProps {
    const role = String(row.role ?? MembershipRole.MEMBER);
    return {
      membershipId: String(row.membership_id),
      tenantId: String(row.tenant_id),
      tenantCode: String(row.tenant_code),
      tenantDisplayName: String(row.tenant_display_name),
      tenantStatus: String(row.tenant_status),
      membershipStatus: String(row.membership_status),
      role,
      joinedAt: row.joined_at as Date,
      isTenantAdmin: isAdminRole(role),
    };
  }

  private map(e: TenantMembershipEntity): TenantMembershipProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      userId: e.userId,
      status: e.status,
      role: e.role,
      joinedAt: e.joinedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
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
