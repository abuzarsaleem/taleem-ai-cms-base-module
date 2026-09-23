import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdmissionsRole } from '@app/common';
import { Repository } from 'typeorm';
import { ApplicationAccessService } from '../../access/application/application-access.service.js';
import { IDENTITY_REPOSITORY } from '../../identity/domain/identity.repository.interface.js';
import type { IIdentityRepository } from '../../identity/domain/identity.repository.interface.js';
import { RoleEntity } from '../../rbac/infrastructure/persistence/rbac.entities.js';
import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';
import {
  APPLICATION_REPOSITORY,
  type IApplicationRepository,
} from '../../subscription/domain/subscription.repository.interface.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../domain/invitation.repository.interface.js';
import { MembershipRole, MembershipStatus } from '../domain/membership.types.js';
import { TenantInvitationService } from './tenant-invitation.service.js';
import {
  ApplicantMemberOnboardDto,
  ApplicantMemberOnboardResponseDto,
  ApplicantMemberOnboardStatus,
} from './dto/request/applicant-member-onboard.dto.js';

const ADMISSIONS_APPLICATION_CODE = 'ADM-AS-1122';

@Injectable()
export class ApplicantMemberOnboardService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly invitations: TenantInvitationService,
    private readonly applicationAccess: ApplicationAccessService,
    private readonly entitlementPolicy: EntitlementPolicyService,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: IApplicationRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly memberships: ITenantMembershipRepository,
    @Inject(IDENTITY_REPOSITORY)
    private readonly identities: IIdentityRepository,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
  ) {}

  async onboard(
    tenantId: string,
    dto: ApplicantMemberOnboardDto,
  ): Promise<ApplicantMemberOnboardResponseDto> {
    await this.tenantContext.ensureTenantExists(tenantId);
    const email = dto.email.toLowerCase();
    const { applicationId, roleId } = await this.requireApplicantRole(tenantId);

    const existingUser = await this.identities.findByEmail(email);
    if (existingUser?.id) {
      const membership = await this.memberships.findByTenantAndUser(
        tenantId,
        existingUser.id,
      );
      if (membership?.status === MembershipStatus.ACTIVE) {
        const applicationAccess = await this.applicationAccess.ensureAccess(
          tenantId,
          {
            userId: existingUser.id,
            applicationId,
            roleId,
            isDefault: dto.isDefault !== false,
          },
        );
        return {
          status: ApplicantMemberOnboardStatus.ACCESS_GRANTED,
          tenantId,
          email,
          userId: existingUser.id,
          applicationAccess,
        };
      }
    }

    const invitation = await this.invitations.create(
      tenantId,
      { email, role: MembershipRole.MEMBER },
      undefined,
      {
        // Admissions portal emails the verification/activate link; do not send IAM invite mail.
        sendEmail: false,
        metadata: {
          source: 'applicant-member-onboard',
          fullName: dto.fullName,
          pendingApplicationAccess: [
            {
              applicationId,
              roleId,
              applicationCode: ADMISSIONS_APPLICATION_CODE,
              roleCode: AdmissionsRole.APPLICANT,
              isDefault: dto.isDefault !== false,
            },
          ],
        },
      },
    );

    return {
      status: ApplicantMemberOnboardStatus.INVITED,
      tenantId,
      email,
      invitation,
    };
  }

  private async requireApplicantRole(tenantId: string) {
    const access = await this.entitlementPolicy.evaluateAccess(
      tenantId,
      ADMISSIONS_APPLICATION_CODE,
    );
    if (!access.entitled) {
      throw new BadRequestException(
        `Tenant is not entitled to ${ADMISSIONS_APPLICATION_CODE}` +
          (access.reason ? ` (${access.reason})` : ''),
      );
    }

    const application = await this.applications.findByCode(
      ADMISSIONS_APPLICATION_CODE,
    );
    if (!application?.id) {
      throw new NotFoundException(
        `Application '${ADMISSIONS_APPLICATION_CODE}' not found`,
      );
    }

    const role = await this.roles.findOne({
      where: {
        roleCode: AdmissionsRole.APPLICANT,
        applicationId: application.id,
      },
    });
    if (!role) {
      throw new NotFoundException(
        `Application role '${AdmissionsRole.APPLICANT}' not found for ${ADMISSIONS_APPLICATION_CODE}`,
      );
    }

    return { applicationId: application.id, roleId: role.id };
  }
}
