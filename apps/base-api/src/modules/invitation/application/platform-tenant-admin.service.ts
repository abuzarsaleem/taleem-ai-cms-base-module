import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { ApplicationAccessService } from '../../access/application/application-access.service.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../domain/invitation.repository.interface.js';
import { MembershipRole } from '../domain/membership.types.js';
import { TenantInvitationService } from './tenant-invitation.service.js';
import { TenantMembershipService } from './tenant-membership.service.js';
import {
  ProvisionTenantAdminDto,
  ProvisionTenantAdminMode,
  type PlatformTenantAdminQueryDto,
} from './dto/request/tenant-admin.request.dto.js';
import type {
  PlatformTenantAdminListResponseDto,
  PlatformTenantAdminResponseDto,
  ProvisionTenantAdminResponseDto,
} from './dto/response/tenant-admin.response.dto.js';

@Injectable()
export class PlatformTenantAdminService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly memberships: TenantMembershipService,
    private readonly invitations: TenantInvitationService,
    @Inject(forwardRef(() => ApplicationAccessService))
    private readonly applicationAccess: ApplicationAccessService,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
  ) {}

  async list(query: PlatformTenantAdminQueryDto): Promise<PlatformTenantAdminListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.membershipRepo.findTenantAdmins(page, limit, {
      tenantId: query.tenantId,
      applicationId: query.applicationId,
      status: query.status,
      search: query.search,
    });

    const summaries = await this.applicationAccess.listSummariesForMembers(
      data.map((row) => ({ tenantId: row.tenantId, userId: row.userId })),
    );

    const rows: PlatformTenantAdminResponseDto[] = data.map((row) => ({
      id: row.id!,
      tenantId: row.tenantId,
      tenantCode: row.tenantCode,
      tenantDisplayName: row.tenantDisplayName,
      userId: row.userId,
      userEmail: row.userEmail,
      userFullName: row.userFullName,
      status: String(row.status),
      role: String(row.role),
      isTenantAdmin: row.isTenantAdmin,
      createdAt: row.createdAt!,
      joinedAt: row.joinedAt!,
      applications: summaries.get(`${row.tenantId}:${row.userId}`) ?? [],
    }));

    return paginatedResponse(rows, total, page, limit);
  }

  async provision(
    tenantId: string,
    dto: ProvisionTenantAdminDto,
    actorUserId: string,
  ): Promise<ProvisionTenantAdminResponseDto> {
    await this.tenantContext.ensureTenantExists(tenantId);
    const email = dto.email.toLowerCase().trim();
    const applications = dto.applications ?? [];

    if (dto.mode === ProvisionTenantAdminMode.CREATE) {
      if (!dto.password?.trim()) {
        throw new BadRequestException('password is required when mode=CREATE');
      }
      if (!dto.fullName?.trim()) {
        throw new BadRequestException('fullName is required when mode=CREATE');
      }

      const membership = await this.memberships.createDirect(
        tenantId,
        {
          email,
          password: dto.password,
          fullName: dto.fullName.trim(),
        },
        MembershipRole.ADMIN,
        actorUserId,
      );

      const applicationAccess = [];
      for (const app of applications) {
        applicationAccess.push(
          await this.applicationAccess.ensureAccess(
            tenantId,
            {
              userId: membership.userId,
              applicationId: app.applicationId,
              roleId: app.roleId,
              isDefault: app.isDefault === true,
            },
            actorUserId,
          ),
        );
      }

      return {
        status: 'CREATED',
        membership,
        applicationAccess,
      };
    }

    const invitation = await this.invitations.create(
      tenantId,
      { email, role: MembershipRole.ADMIN },
      actorUserId,
      {
        metadata: {
          source: 'platform-tenant-admin-provision',
          fullName: dto.fullName?.trim(),
          pendingApplicationAccess: applications.map((app) => ({
            applicationId: app.applicationId,
            roleId: app.roleId,
            isDefault: app.isDefault === true,
          })),
        },
      },
    );

    return {
      status: 'INVITED',
      invitation,
    };
  }
}
