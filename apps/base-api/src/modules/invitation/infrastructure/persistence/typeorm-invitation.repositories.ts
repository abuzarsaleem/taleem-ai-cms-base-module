import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import { MembershipRole, MembershipStatus } from '../../domain/membership.types.js';
import {
  ITenantMembershipRepository,
  type TenantMembershipDetailProps,
  type TenantMembershipProps,
  type UserTenantMembershipProps,
} from '../../domain/invitation.repository.interface.js';
import { TenantMembershipEntity } from './invitation.entities.js';
import { IdentityIdentifierEntity } from '../../../identity/infrastructure/persistence/identity.entities.js';
import { IdentifierType } from '../../../identity/domain/identity.types.js';

const SCHEMA = `"${DATABASE_SCHEMA}"`;

/** Membership row plus the flattened identity display fields the API exposes. */
const MEMBERSHIP_PROJECTION = `
  SELECT
    m.id,
    m.tenant_id,
    m.identity_id,
    m.status,
    m.role,
    m.joined_at,
    m.created_at,
    m.updated_at,
    em.identifier_value AS user_email,
    p.display_name AS user_full_name
  FROM ${SCHEMA}.tenant_memberships m
  INNER JOIN ${SCHEMA}.identities i ON i.id = m.identity_id
  LEFT JOIN ${SCHEMA}.identity_profiles p ON p.identity_id = m.identity_id
  LEFT JOIN ${SCHEMA}.identity_identifiers em
    ON em.identity_id = m.identity_id
   AND em.identifier_type = 'EMAIL'
   AND em.is_primary = TRUE
`;

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
    @InjectRepository(IdentityIdentifierEntity)
    private readonly identifierRepo: Repository<IdentityIdentifierEntity>,
  ) {}

  async findByTenant(tenantId: string, page: number, limit: number) {
    const rows = await this.repo.manager.query(
      `
      ${MEMBERSHIP_PROJECTION}
      WHERE m.tenant_id = $1
      ORDER BY m.joined_at DESC
      LIMIT $2 OFFSET $3
      `,
      [tenantId, limit, (page - 1) * limit],
    );

    const [{ count }] = await this.repo.manager.query(
      `SELECT COUNT(*)::int AS count FROM ${SCHEMA}.tenant_memberships WHERE tenant_id = $1`,
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
      where.push(`m.identity_id = $${params.length}`);
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
      where.push(`em.identifier_value ILIKE $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit, (page - 1) * limit);

    const rows = await this.repo.manager.query(
      `
      ${MEMBERSHIP_PROJECTION}
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
      FROM ${SCHEMA}.tenant_memberships m
      INNER JOIN ${SCHEMA}.identities i ON i.id = m.identity_id
      LEFT JOIN ${SCHEMA}.identity_identifiers em
        ON em.identity_id = m.identity_id
       AND em.identifier_type = 'EMAIL'
       AND em.is_primary = TRUE
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
      ${MEMBERSHIP_PROJECTION}
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
      FROM ${SCHEMA}.tenant_memberships m
      INNER JOIN ${SCHEMA}.tenants t ON t.id = m.tenant_id
      WHERE m.identity_id = $1
      ORDER BY m.joined_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, (page - 1) * limit],
    );

    const [{ count }] = await this.repo.manager.query(
      `SELECT COUNT(*)::int AS count FROM ${SCHEMA}.tenant_memberships WHERE identity_id = $1`,
      [userId],
    );

    return {
      data: rows.map((row: Record<string, unknown>) => this.mapUserTenantRow(row)),
      total: Number(count),
    };
  }

  async findByTenantAndUser(tenantId: string, userId: string) {
    const row = await this.repo.findOne({ where: { tenantId, identityId: userId } });
    return row ? this.map(row) : null;
  }

  async findActiveAdminByEmail(tenantId: string, email: string) {
    const identifier = await this.identifierRepo.findOne({
      where: {
        identifierType: IdentifierType.EMAIL,
        identifierValue: email.toLowerCase(),
      },
    });
    if (!identifier) return null;

    const row = await this.repo.findOne({
      where: {
        tenantId,
        identityId: identifier.identityId,
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
    const existing = await this.repo.findOne({ where: { tenantId, identityId: userId } });
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
          identityId: userId,
          status: MembershipStatus.ACTIVE,
          role,
        }),
      ),
    );
  }

  async updateRole(tenantId: string, userId: string, role: string) {
    const existing = await this.repo.findOne({ where: { tenantId, identityId: userId } });
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
      userId: String(row.identity_id),
      status: String(row.status),
      role,
      joinedAt: row.joined_at as Date,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      userEmail: String(row.user_email ?? ''),
      userFullName: String(row.user_full_name ?? ''),
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
      userId: e.identityId,
      status: e.status,
      role: e.role,
      joinedAt: e.joinedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
