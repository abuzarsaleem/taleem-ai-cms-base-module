import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../auth/application/auth.service.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { UserStatus } from '../../user/domain/user.types.js';
import {
  TENANT_ADMIN_INVITATION_REPOSITORY,
  TENANT_MEMBER_INVITATION_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  USER_IDENTITY_REPOSITORY,
  type ITenantAdminInvitationRepository,
  type ITenantMemberInvitationRepository,
  type ITenantMembershipRepository,
  type IUserIdentityRepository,
} from '../domain/invitation.repository.interface.js';
import { InvitationStatus } from '../domain/invitation.types.js';
import { MembershipRole } from '../domain/membership.types.js';
import type { AcceptInvitationDto } from './dto/request/invitation.request.dto.js';
import { hashInvitationToken } from './invitation-token.util.js';

@Injectable()
export class InvitationAcceptService {
  constructor(
    private readonly config: ConfigService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(TENANT_ADMIN_INVITATION_REPOSITORY)
    private readonly adminInvitationRepo: ITenantAdminInvitationRepository,
    @Inject(TENANT_MEMBER_INVITATION_REPOSITORY)
    private readonly memberInvitationRepo: ITenantMemberInvitationRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
    @Inject(USER_IDENTITY_REPOSITORY)
    private readonly identityRepo: IUserIdentityRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  accept(dto: AcceptInvitationDto) {
    const tokenHash = hashInvitationToken(dto.token);
    return this.acceptByTokenHash(tokenHash, dto);
  }

  private async acceptByTokenHash(tokenHash: string, dto: AcceptInvitationDto) {
    const adminInvitation = await this.adminInvitationRepo.findByTokenHash(tokenHash);
    if (adminInvitation) {
      return this.acceptAdminInvitation(adminInvitation, dto);
    }

    const memberInvitation = await this.memberInvitationRepo.findByTokenHash(tokenHash);
    if (memberInvitation) {
      return this.acceptMemberInvitation(memberInvitation, dto);
    }

    throw new BadRequestException('Invalid or expired invitation token');
  }

  private async acceptAdminInvitation(
    invitation: NonNullable<Awaited<ReturnType<ITenantAdminInvitationRepository['findByTokenHash']>>>,
    dto: AcceptInvitationDto,
  ) {
    await this.assertInvitationPending(invitation.status, invitation.expiresAt, async () => {
      await this.adminInvitationRepo.update(invitation.tenantId, invitation.id!, {
        status: InvitationStatus.EXPIRED,
      });
    });

    if (await this.membershipRepo.findActiveAdminByEmail(invitation.tenantId, invitation.email)) {
      throw new ConflictException('User is already an active tenant administrator');
    }

    const user = await this.provisionUser(invitation.email, dto);
    await this.membershipRepo.upsertActive(invitation.tenantId, user.id!, MembershipRole.ADMIN);

    await this.adminInvitationRepo.update(invitation.tenantId, invitation.id!, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    return this.authService.issueTokensForUser(user.id!);
  }

  private async acceptMemberInvitation(
    invitation: NonNullable<Awaited<ReturnType<ITenantMemberInvitationRepository['findByTokenHash']>>>,
    dto: AcceptInvitationDto,
  ) {
    await this.assertInvitationPending(invitation.status, invitation.expiresAt, async () => {
      await this.memberInvitationRepo.update(invitation.tenantId, invitation.id!, {
        status: InvitationStatus.EXPIRED,
      });
    });

    const existingUser = await this.userRepository.findByEmail(invitation.email);
    if (existingUser?.id) {
      const existingMembership = await this.membershipRepo.findByTenantAndUser(
        invitation.tenantId,
        existingUser.id,
      );
      if (existingMembership?.status === 'ACTIVE') {
        throw new ConflictException('User is already an active member of this tenant');
      }
    }

    const user = await this.provisionUser(invitation.email, dto);
    await this.membershipRepo.upsertActive(invitation.tenantId, user.id!, MembershipRole.MEMBER);

    await this.memberInvitationRepo.update(invitation.tenantId, invitation.id!, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    return this.authService.issueTokensForUser(user.id!);
  }

  private async assertInvitationPending(
    status: InvitationStatus,
    expiresAt: Date,
    markExpired: () => Promise<void>,
  ) {
    if (status === InvitationStatus.CANCELLED) {
      throw new BadRequestException('This invitation has been cancelled');
    }
    if (status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }
    if (status === InvitationStatus.EXPIRED || expiresAt <= new Date()) {
      if (status === InvitationStatus.PENDING) {
        await markExpired();
      }
      throw new BadRequestException('This invitation has expired');
    }
  }

  private async provisionUser(email: string, dto: AcceptInvitationDto) {
    const fullName = dto.fullName?.trim();
    let user = await this.userRepository.findByEmail(email);

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
        email,
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
      await this.identityRepo.createLocal(user.id, email);
    }

    return user;
  }
}
