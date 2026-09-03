import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { paginatedResponse } from '@app/common';
import { EMAIL_SERVICE, type IEmailService } from '../../notification/domain/email.service.interface.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { TENANT_REPOSITORY } from '../../tenant/domain/tenant.repository.interface.js';
import type { ITenantRepository } from '../../tenant/domain/tenant.repository.interface.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_ADMIN_INVITATION_REPOSITORY,
  TENANT_MEMBER_INVITATION_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantAdminInvitationRepository,
  type ITenantMemberInvitationRepository,
  type ITenantMembershipRepository,
} from '../domain/invitation.repository.interface.js';
import { InvitationStatus } from '../domain/invitation.types.js';
import { MembershipRole } from '../domain/membership.types.js';
import { CreateTenantAdminInvitationDto } from './dto/request/invitation.request.dto.js';
import { generateInvitationToken } from './invitation-token.util.js';
import { InvitationEmailService } from './invitation-email.service.js';
import {
  toCreateInvitationResponse,
  toInvitationResponse,
} from './mappers/invitation.mapper.js';

@Injectable()
export class TenantMemberInvitationService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
    private readonly invitationEmail: InvitationEmailService,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
    @Inject(TENANT_MEMBER_INVITATION_REPOSITORY)
    private readonly invitationRepo: ITenantMemberInvitationRepository,
    @Inject(TENANT_ADMIN_INVITATION_REPOSITORY)
    private readonly adminInvitationRepo: ITenantAdminInvitationRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.invitationRepo.findByTenant(tenantId, page, limit);
    return paginatedResponse(
      data.map((row) => toInvitationResponse(row, MembershipRole.MEMBER)),
      total,
      page,
      limit,
    );
  }

  async create(tenantId: string, dto: CreateTenantAdminInvitationDto, invitedBy: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const email = dto.email.toLowerCase();

    await this.assertCanInvite(tenantId, email);

    const { raw, hash } = generateInvitationToken();
    const expiresAt = this.buildExpiryDate();

    const invitation = await this.invitationRepo.create({
      tenantId,
      email,
      tokenHash: hash,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedBy,
    });

    const tenant = await this.tenantRepository.findById(tenantId);
    await this.invitationEmail.sendMemberInvitation(this.emailService, {
      to: email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(invitation, raw, MembershipRole.MEMBER);
  }

  async cancel(tenantId: string, id: string) {
    const invitation = await this.getPendingInvitation(tenantId, id);
    return toInvitationResponse(
      await this.invitationRepo.update(tenantId, invitation.id!, {
        status: InvitationStatus.CANCELLED,
      }),
      MembershipRole.MEMBER,
    );
  }

  async resend(tenantId: string, id: string) {
    const invitation = await this.getPendingInvitation(tenantId, id);
    const { raw, hash } = generateInvitationToken();
    const expiresAt = this.buildExpiryDate();

    const updated = await this.invitationRepo.update(tenantId, invitation.id!, {
      tokenHash: hash,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    const tenant = await this.tenantRepository.findById(tenantId);
    await this.invitationEmail.sendMemberInvitation(this.emailService, {
      to: invitation.email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(updated, raw, MembershipRole.MEMBER);
  }

  private async assertCanInvite(tenantId: string, email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (user?.id) {
      const membership = await this.membershipRepo.findByTenantAndUser(tenantId, user.id);
      if (membership?.status === 'ACTIVE') {
        throw new ConflictException('User is already an active member of this tenant');
      }
    }

    if (await this.invitationRepo.findPendingByEmail(tenantId, email)) {
      throw new ConflictException('A pending member invitation already exists for this email');
    }

    if (await this.adminInvitationRepo.findPendingByEmail(tenantId, email)) {
      throw new ConflictException('A pending admin invitation already exists for this email');
    }
  }

  private async getPendingInvitation(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const invitation = await this.invitationRepo.findById(tenantId, id);
    if (!invitation) {
      throw new NotFoundException(`Invitation '${id}' not found`);
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation is ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt <= new Date()) {
      await this.invitationRepo.update(tenantId, id, { status: InvitationStatus.EXPIRED });
      throw new BadRequestException('Invitation has expired');
    }
    return invitation;
  }

  private buildExpiryDate(): Date {
    const ttlHours = this.config.get<number>('invitation.ttlHours', 168);
    return new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  }
}
