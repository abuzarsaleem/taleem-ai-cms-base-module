import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { paginatedResponse } from '@app/common';
import { EMAIL_SERVICE, type IEmailService } from '../../notification/domain/email.service.interface.js';
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
import { CreateTenantAdminInvitationDto, AcceptInvitationDto } from './dto/request/invitation.request.dto.js';
import { InvitationAcceptService } from './invitation-accept.service.js';
import { generateInvitationToken } from './invitation-token.util.js';
import { InvitationEmailService } from './invitation-email.service.js';
import {
  toCreateInvitationResponse,
  toInvitationResponse,
} from './mappers/invitation.mapper.js';

@Injectable()
export class TenantAdminInvitationService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
    private readonly invitationEmail: InvitationEmailService,
    private readonly acceptService: InvitationAcceptService,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
    @Inject(TENANT_ADMIN_INVITATION_REPOSITORY)
    private readonly invitationRepo: ITenantAdminInvitationRepository,
    @Inject(TENANT_MEMBER_INVITATION_REPOSITORY)
    private readonly memberInvitationRepo: ITenantMemberInvitationRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.invitationRepo.findByTenant(tenantId, page, limit);
    return paginatedResponse(
      data.map((row) => toInvitationResponse(row, MembershipRole.ADMIN)),
      total,
      page,
      limit,
    );
  }

  async create(tenantId: string, dto: CreateTenantAdminInvitationDto, invitedBy: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const email = dto.email.toLowerCase();

    if (await this.membershipRepo.findActiveAdminByEmail(tenantId, email)) {
      throw new ConflictException('User is already an active tenant administrator');
    }

    if (await this.invitationRepo.findPendingByEmail(tenantId, email)) {
      throw new ConflictException('A pending admin invitation already exists for this email');
    }

    if (await this.memberInvitationRepo.findPendingByEmail(tenantId, email)) {
      throw new ConflictException('A pending member invitation already exists for this email');
    }

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
    await this.invitationEmail.sendAdminInvitation(this.emailService, {
      to: email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(invitation, raw, MembershipRole.ADMIN);
  }

  async cancel(tenantId: string, id: string) {
    const invitation = await this.getPendingInvitation(tenantId, id);
    return toInvitationResponse(
      await this.invitationRepo.update(tenantId, invitation.id!, {
        status: InvitationStatus.CANCELLED,
      }),
      MembershipRole.ADMIN,
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
    await this.invitationEmail.sendAdminInvitation(this.emailService, {
      to: invitation.email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(updated, raw, MembershipRole.ADMIN);
  }

  accept(dto: AcceptInvitationDto) {
    return this.acceptService.accept(dto);
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
