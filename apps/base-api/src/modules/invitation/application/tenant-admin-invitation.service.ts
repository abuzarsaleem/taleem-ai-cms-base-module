import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { paginatedResponse } from '@app/common';
import { EMAIL_SERVICE, type IEmailService } from '../../notification/domain/email.service.interface.js';
import { AuthService } from '../../auth/application/auth.service.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { UserStatus } from '../../user/domain/user.types.js';
import { TENANT_REPOSITORY } from '../../tenant/domain/tenant.repository.interface.js';
import type { ITenantRepository } from '../../tenant/domain/tenant.repository.interface.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_ADMIN_INVITATION_REPOSITORY,
  TENANT_ADMINISTRATOR_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  USER_IDENTITY_REPOSITORY,
  type ITenantAdminInvitationRepository,
  type ITenantAdministratorRepository,
  type ITenantMembershipRepository,
  type IUserIdentityRepository,
} from '../domain/invitation.repository.interface.js';
import { InvitationStatus } from '../domain/invitation.types.js';
import { CreateTenantAdminInvitationDto, AcceptInvitationDto } from './dto/request/invitation.request.dto.js';
import { generateInvitationToken, hashInvitationToken } from './invitation-token.util.js';
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
    private readonly authService: AuthService,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
    @Inject(TENANT_ADMIN_INVITATION_REPOSITORY)
    private readonly invitationRepo: ITenantAdminInvitationRepository,
    @Inject(TENANT_ADMINISTRATOR_REPOSITORY)
    private readonly administratorRepo: ITenantAdministratorRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
    @Inject(USER_IDENTITY_REPOSITORY)
    private readonly identityRepo: IUserIdentityRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.invitationRepo.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toInvitationResponse), total, page, limit);
  }

  async create(tenantId: string, dto: CreateTenantAdminInvitationDto, invitedBy: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const email = dto.email.toLowerCase();

    if (await this.administratorRepo.findActiveByTenantAndEmail(tenantId, email)) {
      throw new ConflictException('User is already an active tenant administrator');
    }

    if (await this.invitationRepo.findPendingByEmail(tenantId, email)) {
      throw new ConflictException('A pending invitation already exists for this email');
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
    await this.invitationEmail.sendInvitation(this.emailService, {
      to: email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(invitation, raw);
  }

  async cancel(tenantId: string, id: string) {
    const invitation = await this.getPendingInvitation(tenantId, id);
    return toInvitationResponse(
      await this.invitationRepo.update(tenantId, invitation.id!, {
        status: InvitationStatus.CANCELLED,
      }),
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
    await this.invitationEmail.sendInvitation(this.emailService, {
      to: invitation.email,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? 'your institution',
      invitationToken: raw,
      expiresAt,
    });

    return toCreateInvitationResponse(updated, raw);
  }

  async accept(dto: AcceptInvitationDto) {
    const tokenHash = hashInvitationToken(dto.token);
    const invitation = await this.invitationRepo.findByTokenHash(tokenHash);
    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    if (invitation.status === InvitationStatus.CANCELLED) {
      throw new BadRequestException('This invitation has been cancelled');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.status === InvitationStatus.EXPIRED || invitation.expiresAt <= new Date()) {
      if (invitation.status === InvitationStatus.PENDING) {
        await this.invitationRepo.update(invitation.tenantId, invitation.id!, {
          status: InvitationStatus.EXPIRED,
        });
      }
      throw new BadRequestException('This invitation has expired');
    }

    if (await this.administratorRepo.findActiveByTenantAndEmail(invitation.tenantId, invitation.email)) {
      throw new ConflictException('User is already an active tenant administrator');
    }

    const fullName = dto.fullName?.trim();
    let user = await this.userRepository.findByEmail(invitation.email);

    if (user?.id) {
      if (!user.passwordHash) {
        if (!dto.password) {
          throw new BadRequestException('Password is required to activate this account');
        }
        if (!fullName) {
          throw new BadRequestException('Full name is required to activate this account');
        }
        const saltRounds = this.config.get<number>('auth.bcryptSaltRounds', 12);
        user = await this.userRepository.update(user.id, {
          passwordHash: await bcrypt.hash(dto.password, saltRounds),
          emailVerified: true,
          fullName,
          status: UserStatus.ACTIVE,
        });
      }
    } else {
      if (!dto.password) {
        throw new BadRequestException('Password is required to create your account');
      }
      if (!fullName) {
        throw new BadRequestException('Full name is required to create your account');
      }
      const saltRounds = this.config.get<number>('auth.bcryptSaltRounds', 12);
      user = await this.userRepository.create({
        email: invitation.email,
        passwordHash: await bcrypt.hash(dto.password, saltRounds),
        emailVerified: true,
        fullName,
        status: UserStatus.ACTIVE,
      });
    }

    if (!user.id) {
      throw new BadRequestException('Unable to provision user account');
    }

    if (!(await this.identityRepo.findLocalByUserId(user.id))) {
      await this.identityRepo.createLocal(user.id, invitation.email);
    }

    await this.membershipRepo.upsertActive(invitation.tenantId, user.id);
    await this.administratorRepo.upsertActive(invitation.tenantId, user.id, invitation.invitedBy);

    await this.invitationRepo.update(invitation.tenantId, invitation.id!, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    return this.authService.issueTokensForUser(user.id);
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
