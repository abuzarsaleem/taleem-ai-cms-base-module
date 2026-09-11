import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginatedResponse } from '@app/common';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../../invitation/domain/invitation.repository.interface.js';
import { MembershipStatus } from '../../invitation/domain/membership.types.js';
import {
  APPLICATION_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type IApplicationRepository,
  type ISubscriptionRepository,
  type ITenantEntitlementRepository,
} from '../../subscription/domain/subscription.repository.interface.js';
import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';
import { RoleEntity, RolePermissionEntity } from '../../rbac/infrastructure/persistence/rbac.entities.js';
import {
  ApplicationAccessAssignmentEntity,
  ApplicationAccessStatus,
  ApplicationPermissionEntity,
} from '../infrastructure/persistence/access.entities.js';
import { ApplicationStatus } from '../../subscription/domain/subscription.types.js';
import type {
  ApplicationAccessQueryDto,
  ApplicationAccessResponseDto,
  CreateApplicationAccessDto,
  UpdateApplicationAccessDto,
} from './dto/access.dto.js';

@Injectable()
export class ApplicationAccessService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly entitlementPolicy: EntitlementPolicyService,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly memberships: ITenantMembershipRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: IApplicationRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY)
    private readonly entitlements: ITenantEntitlementRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: ISubscriptionRepository,
    @InjectRepository(ApplicationAccessAssignmentEntity)
    private readonly assignments: Repository<ApplicationAccessAssignmentEntity>,
    @InjectRepository(ApplicationPermissionEntity)
    private readonly appPermissions: Repository<ApplicationPermissionEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
  ) {}

  async list(tenantId: string, query: ApplicationAccessQueryDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.assignments
      .createQueryBuilder('a')
      .where('a.tenant_id = :tenantId', { tenantId })
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.userId) qb.andWhere('a.identity_id = :userId', { userId: query.userId });
    if (query.applicationId) {
      qb.andWhere('a.application_id = :applicationId', { applicationId: query.applicationId });
    }
    if (query.status) qb.andWhere('a.status = :status', { status: query.status });

    const [rows, total] = await qb.getManyAndCount();
    const data = await Promise.all(rows.map((row) => this.toResponse(row)));
    return paginatedResponse(data, total, page, limit);
  }

  async get(tenantId: string, id: string) {
    const row = await this.requireAssignment(tenantId, id);
    return this.toResponse(row);
  }

  /**
   * Active application role codes for an identity within a tenant.
   * Used when issuing OAuth access tokens (e.g. ALUMNI_MEMBER / ALUMNI_ADMIN).
   */
  async listActiveRoleCodes(params: {
    identityId: string;
    tenantId: string;
    applicationId: string;
  }): Promise<string[]> {
    const rows = await this.assignments
      .createQueryBuilder('a')
      .innerJoin(RoleEntity, 'r', 'r.id = a.role_id')
      .select('DISTINCT r.role_code', 'role_code')
      .where('a.tenant_id = :tenantId', { tenantId: params.tenantId })
      .andWhere('a.identity_id = :identityId', { identityId: params.identityId })
      .andWhere('a.application_id = :applicationId', {
        applicationId: params.applicationId,
      })
      .andWhere('a.status = :status', { status: ApplicationAccessStatus.ACTIVE })
      .getRawMany<{ role_code?: string; roleCode?: string }>();

    return [
      ...new Set(
        rows
          .map((row) => row.role_code ?? row.roleCode)
          .filter((code): code is string => Boolean(code?.trim())),
      ),
    ];
  }

  async create(tenantId: string, dto: CreateApplicationAccessDto, actorUserId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    await this.assertMembershipActive(tenantId, dto.userId);
    await this.assertEntitlementActive(tenantId, dto.applicationId);
    const role = await this.requireApplicationRole(dto.roleId, dto.applicationId);

    const existing = await this.assignments.findOne({
      where: {
        tenantId,
        identityId: dto.userId,
        applicationId: dto.applicationId,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Application access already assigned for this member and application',
      );
    }

    const isDefault = dto.isDefault === true;
    if (isDefault) {
      await this.clearDefault(tenantId, dto.userId);
    }

    const saved = await this.assignments.save(
      this.assignments.create({
        tenantId,
        identityId: dto.userId,
        applicationId: dto.applicationId,
        roleId: role.id,
        status: ApplicationAccessStatus.ACTIVE,
        isDefault,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      }),
    );

    return this.toResponse(saved);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateApplicationAccessDto,
    actorUserId: string,
  ) {
    const row = await this.requireAssignment(tenantId, id);

    if (dto.roleId) {
      await this.requireApplicationRole(dto.roleId, row.applicationId);
      row.roleId = dto.roleId;
    }
    if (dto.status) row.status = dto.status;
    if (dto.isDefault === true) {
      await this.clearDefault(tenantId, row.identityId, row.id);
      row.isDefault = true;
    } else if (dto.isDefault === false) {
      row.isDefault = false;
    }

    if (row.status === ApplicationAccessStatus.ACTIVE) {
      await this.assertMembershipActive(tenantId, row.identityId);
      await this.assertEntitlementActive(tenantId, row.applicationId);
    }

    row.updatedBy = actorUserId;
    return this.toResponse(await this.assignments.save(row));
  }

  async listRolesForApplication(applicationCode?: string) {
    const qb = this.roles
      .createQueryBuilder('r')
      .where('r.application_id IS NOT NULL')
      .andWhere('r.role_type = :roleType', { roleType: 'SYSTEM' })
      .orderBy('r.role_code', 'ASC');

    if (applicationCode) {
      const application = await this.applications.findByCode(applicationCode);
      if (!application?.id) {
        return [];
      }
      qb.andWhere('r.application_id = :applicationId', { applicationId: application.id });
    }

    const roles = await qb.getMany();
    return Promise.all(
      roles.map(async (role) => ({
        id: role.id,
        roleCode: role.roleCode,
        roleName: role.roleName,
        description: role.description,
        applicationId: role.applicationId!,
        roleType: role.roleType,
        permissionCodes: await this.permissionCodesForRole(role.id),
      })),
    );
  }

  async listPermissionsForApplication(applicationId: string) {
    const rows = await this.appPermissions.find({
      where: { applicationId },
      order: { permissionCode: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      applicationId: row.applicationId,
      permissionCode: row.permissionCode,
      name: row.name,
      description: row.description,
    }));
  }

  private async requireAssignment(tenantId: string, id: string) {
    const row = await this.assignments.findOne({ where: { id, tenantId } });
    if (!row) throw new NotFoundException(`Application access assignment '${id}' not found`);
    return row;
  }

  private async assertMembershipActive(tenantId: string, userId: string) {
    const membership = await this.memberships.findByTenantAndUser(tenantId, userId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Target user must have an ACTIVE tenant membership');
    }
  }

  private async assertEntitlementActive(tenantId: string, applicationId: string) {
    const application = await this.applications.findById(applicationId);
    if (!application) throw new NotFoundException(`Application '${applicationId}' not found`);

    const entitlement = await this.entitlements.findByTenantAndApplication(
      tenantId,
      applicationId,
    );
    if (!entitlement) {
      throw new BadRequestException('Tenant is not entitled to this application');
    }

    const subscription = entitlement.subscriptionId
      ? await this.subscriptions.findById(tenantId, entitlement.subscriptionId)
      : null;

    const evaluation = this.entitlementPolicy.evaluateEntitlement(
      entitlement,
      application,
      subscription,
    );
    if (!evaluation.ok) {
      throw new BadRequestException(
        `Tenant entitlement is not active for this application (${evaluation.reason})`,
      );
    }
  }

  private async requireApplicationRole(roleId: string, applicationId: string) {
    const role = await this.roles.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role '${roleId}' not found`);
    if (!role.applicationId) {
      throw new BadRequestException('Role is not an application role');
    }
    if (role.applicationId !== applicationId) {
      throw new BadRequestException('Role does not belong to the target application');
    }
    if (role.tenantId) {
      // custom roles can be added later; system Alumni roles have tenant_id NULL
    }
    return role;
  }

  private async clearDefault(tenantId: string, userId: string, exceptId?: string) {
    const qb = this.assignments
      .createQueryBuilder()
      .update(ApplicationAccessAssignmentEntity)
      .set({ isDefault: false })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('identity_id = :userId', { userId })
      .andWhere('is_default = TRUE');
    if (exceptId) qb.andWhere('id != :exceptId', { exceptId });
    await qb.execute();
  }

  private async permissionCodesForRole(roleId: string): Promise<string[]> {
    const rows = await this.appPermissions
      .createQueryBuilder('ap')
      .innerJoin(
        RolePermissionEntity,
        'rp',
        'rp.application_permission_id = ap.id AND rp.role_id = :roleId',
        { roleId },
      )
      .orderBy('ap.permission_code', 'ASC')
      .getMany();
    return rows.map((row) => row.permissionCode);
  }

  private async toResponse(
    row: ApplicationAccessAssignmentEntity,
  ): Promise<ApplicationAccessResponseDto> {
    const [application, role, permissionCodes] = await Promise.all([
      this.applications.findById(row.applicationId),
      this.roles.findOne({ where: { id: row.roleId } }),
      this.permissionCodesForRole(row.roleId),
    ]);

    return {
      id: row.id,
      tenantId: row.tenantId,
      userId: row.identityId,
      applicationId: row.applicationId,
      applicationCode: application?.applicationCode,
      applicationName: application?.name,
      launchUrl: application?.launchUrl,
      roleId: row.roleId,
      roleCode: role?.roleCode,
      roleName: role?.roleName,
      status: row.status,
      isDefault: row.isDefault,
      permissionCodes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Active assignments for the signed-in member whose tenant is entitled
   * to the application. Used by the tenant workspace app launcher.
   */
  async listMineForTenant(
    identityId: string,
    preferredTenantId?: string,
  ): Promise<
    Array<{
      assignmentId: string;
      tenantId: string;
      applicationId: string;
      applicationCode: string;
      applicationName: string;
      launchUrl?: string;
      logoUrl?: string;
      roleId: string;
      roleCode: string;
      roleName?: string;
      isDefault: boolean;
      status: ApplicationAccessStatus;
    }>
  > {
    let tenantId = preferredTenantId?.trim() || '';
    if (!tenantId) {
      const { data: memberships } = await this.memberships.findByUser(identityId, 1, 50);
      const active = memberships.find((m) => m.membershipStatus === MembershipStatus.ACTIVE);
      if (!active) return [];
      tenantId = active.tenantId;
    } else {
      await this.assertMembershipActive(tenantId, identityId);
    }

    const rows = await this.assignments.find({
      where: {
        tenantId,
        identityId,
        status: ApplicationAccessStatus.ACTIVE,
      },
      order: { createdAt: 'ASC' },
    });

    const results: Array<{
      assignmentId: string;
      tenantId: string;
      applicationId: string;
      applicationCode: string;
      applicationName: string;
      launchUrl?: string;
      logoUrl?: string;
      roleId: string;
      roleCode: string;
      roleName?: string;
      isDefault: boolean;
      status: ApplicationAccessStatus;
    }> = [];

    for (const row of rows) {
      const application = await this.applications.findById(row.applicationId);
      if (!application || application.status !== ApplicationStatus.ACTIVE) continue;

      const access = await this.entitlementPolicy.evaluateAccess(
        tenantId,
        application.applicationCode,
      );
      if (!access.entitled) continue;

      const role = await this.roles.findOne({ where: { id: row.roleId } });
      if (!role?.roleCode) continue;

      results.push({
        assignmentId: row.id,
        tenantId: row.tenantId,
        applicationId: row.applicationId,
        applicationCode: application.applicationCode,
        applicationName: application.name,
        launchUrl: application.launchUrl,
        logoUrl: application.logoUrl ?? undefined,
        roleId: row.roleId,
        roleCode: role.roleCode,
        roleName: role.roleName,
        isDefault: row.isDefault,
        status: row.status,
      });
    }

    results.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.applicationName.localeCompare(b.applicationName);
    });
    return results;
  }
}
