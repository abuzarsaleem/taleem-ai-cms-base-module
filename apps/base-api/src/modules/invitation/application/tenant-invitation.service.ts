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
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { TENANT_REPOSITORY } from '../../tenant/domain/tenant.repository.interface.js';
import type { ITenantRepository } from '../../tenant/domain/tenant.repository.interface.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import { USER_TOKEN_REPOSITORY } from '../../auth/domain/user-token.repository.interface.js';
import type { IUserTokenRepository } from '../../auth/domain/user-token.repository.interface.js';
import { UserTokenStatus, UserTokenType } from '../../auth/domain/user-token.types.js';
import { generateToken } from '../../auth/application/token.util.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../domain/invitation.repository.interface.js';
import { MembershipRole } from '../domain/membership.types.js';
import { CreateTenantInvitationDto } from './dto/request/invitation.request.dto.js';
import { InvitationEmailService } from './invitation-email.service.js';
import {
  toCreateInvitationResponse,
  toInvitationResponse,
} from './mappers/invitation.mapper.js';

@Injectable()
export class TenantInvitationService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
    private readonly invitationEmail: InvitationEmailService,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
    @Inject(USER_TOKEN_REPOSITORY) private readonly tokenRepository: IUserTokenRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async list(tenantId: string, page: number, limit: number, role?: MembershipRole) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.tokenRepository.findInvitationsByTenant(
      tenantId,
      page,
      limit,
      role,
    );
    return paginatedResponse(
      data.map((row) => toInvitationResponse(row)),
      total,
      page,
      limit,
    );
  }

  async create(tenantId: string, dto: CreateTenantInvitationDto, invitedBy: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const email = dto.email.toLowerCase();
    const role = dto.role;

    await this.assertCanInvite(tenantId, email, role);

    const { raw, hash } = generateToken();
    const expiresAt = this.buildExpiryDate();

    const invitation = await this.tokenRepository.create({
      tokenType: UserTokenType.TENANT_INVITATION,
      tokenHash: hash,
      tenantId,
      email,
      membershipRole: role,
      status: UserTokenStatus.PENDING,
      expiresAt,
      invitedBy,
    });

    const tenant = await this.tenantRepository.findById(tenantId);
    await this.sendInvitationEmail(role, {
      to: email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(invitation, raw);
  }

  async cancel(tenantId: string, id: string, role?: MembershipRole) {
    const invitation = await this.getPendingInvitation(tenantId, id, role);
    const updated = await this.tokenRepository.update(invitation.id!, {
      status: UserTokenStatus.CANCELLED,
    });
    return toInvitationResponse(updated);
  }

  async resend(tenantId: string, id: string, role?: MembershipRole) {
    const invitation = await this.getPendingInvitation(tenantId, id, role);
    const { raw, hash } = generateToken();
    const expiresAt = this.buildExpiryDate();

    const updated = await this.tokenRepository.update(invitation.id!, {
      tokenHash: hash,
      expiresAt,
      status: UserTokenStatus.PENDING,
    });

    const tenant = await this.tenantRepository.findById(tenantId);
    const membershipRole = (invitation.membershipRole as MembershipRole) ?? role!;
    await this.sendInvitationEmail(membershipRole, {
      to: invitation.email!,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(updated, raw);
  }

  private async assertCanInvite(tenantId: string, email: string, role: MembershipRole) {
    if (role === MembershipRole.ADMIN) {
      if (await this.membershipRepo.findActiveAdminByEmail(tenantId, email)) {
        throw new ConflictException('User is already an active tenant administrator');
      }
    } else {
      const user = await this.userRepository.findByEmail(email);
      if (user?.id) {
        const membership = await this.membershipRepo.findByTenantAndUser(tenantId, user.id);
        if (membership?.status === 'ACTIVE') {
          throw new ConflictException('User is already an active member of this tenant');
        }
      }
    }

    if (await this.tokenRepository.findPendingInvitationByEmail(tenantId, email)) {
      throw new ConflictException('A pending invitation already exists for this email');
    }
  }

  private async getPendingInvitation(tenantId: string, id: string, role?: MembershipRole) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const invitation = await this.tokenRepository.findInvitationById(tenantId, id);
    if (!invitation) {
      throw new NotFoundException(`Invitation '${id}' not found`);
    }
    if (role && invitation.membershipRole !== role) {
      throw new NotFoundException(`Invitation '${id}' not found`);
    }
    if (invitation.status !== UserTokenStatus.PENDING) {
      throw new BadRequestException(`Invitation is ${String(invitation.status).toLowerCase()}`);
    }
    if (invitation.expiresAt <= new Date()) {
      await this.tokenRepository.update(id, { status: UserTokenStatus.EXPIRED });
      throw new BadRequestException('Invitation has expired');
    }
    return invitation;
  }

  private sendInvitationEmail(
    role: MembershipRole,
    payload: {
      to: string;
      tenantName: string;
      invitationToken: string;
      expiresAt: Date;
    },
  ) {
    if (role === MembershipRole.ADMIN) {
      return this.invitationEmail.sendAdminInvitation(this.emailService, payload);
    }
    return this.invitationEmail.sendMemberInvitation(this.emailService, payload);
  }

  private buildExpiryDate(): Date {
    const ttlHours = this.config.get<number>('invitation.ttlHours', 168);
    return new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  }
}
