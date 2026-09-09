import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from '../../auth/application/auth.service.js';
import { hashToken } from '../../auth/application/token.util.js';
import { USER_TOKEN_REPOSITORY } from '../../auth/domain/user-token.repository.interface.js';
import type { IUserTokenRepository } from '../../auth/domain/user-token.repository.interface.js';
import { UserTokenStatus, UserTokenType } from '../../auth/domain/user-token.types.js';
import { IDENTITY_REPOSITORY } from '../../identity/domain/identity.repository.interface.js';
import type { IIdentityRepository } from '../../identity/domain/identity.repository.interface.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../domain/invitation.repository.interface.js';
import { MembershipRole } from '../domain/membership.types.js';
import type { AcceptInvitationDto } from './dto/request/invitation.request.dto.js';
import { MembershipProvisionService } from './membership-provision.service.js';

@Injectable()
export class InvitationAcceptService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(USER_TOKEN_REPOSITORY) private readonly tokenRepository: IUserTokenRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
    @Inject(IDENTITY_REPOSITORY) private readonly userRepository: IIdentityRepository,
    private readonly provision: MembershipProvisionService,
  ) {}

  accept(dto: AcceptInvitationDto) {
    const tokenHash = hashToken(dto.token);
    return this.acceptByTokenHash(tokenHash, dto);
  }

  private async acceptByTokenHash(tokenHash: string, dto: AcceptInvitationDto) {
    const invitation = await this.tokenRepository.findValidByHash(
      tokenHash,
      UserTokenType.TENANT_INVITATION,
    );
    if (!invitation?.id || !invitation.tenantId || !invitation.email) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    return this.acceptInvitation(invitation, dto);
  }

  private async acceptInvitation(
    invitation: NonNullable<Awaited<ReturnType<IUserTokenRepository['findValidByHash']>>>,
    dto: AcceptInvitationDto,
  ) {
    await this.assertInvitationPending(invitation.status, invitation.expiresAt, async () => {
      await this.tokenRepository.update(invitation.id!, { status: UserTokenStatus.EXPIRED });
    });

    const role = invitation.membershipRole ?? MembershipRole.MEMBER;
    const email = invitation.email!;

    if (role === MembershipRole.ADMIN) {
      if (await this.membershipRepo.findActiveAdminByEmail(invitation.tenantId!, email)) {
        throw new ConflictException('User is already an active tenant administrator');
      }
    } else {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser?.id) {
        const existingMembership = await this.membershipRepo.findByTenantAndUser(
          invitation.tenantId!,
          existingUser.id,
        );
        if (existingMembership?.status === 'ACTIVE') {
          throw new ConflictException('User is already an active member of this tenant');
        }
      }
    }

    const user = await this.provision.provision({
      email,
      password: dto.password,
      fullName: dto.fullName,
    });
    await this.membershipRepo.upsertActive(invitation.tenantId!, user.id!, role);

    await this.tokenRepository.update(invitation.id!, {
      status: UserTokenStatus.ACCEPTED,
      usedAt: new Date(),
    });

    return this.authService.issueTokensForUser(user.id!);
  }

  private async assertInvitationPending(
    status: string | undefined,
    expiresAt: Date,
    markExpired: () => Promise<void>,
  ) {
    if (status === UserTokenStatus.CANCELLED) {
      throw new BadRequestException('This invitation has been cancelled');
    }
    if (status === UserTokenStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }
    if (status === UserTokenStatus.EXPIRED || expiresAt <= new Date()) {
      if (status === UserTokenStatus.PENDING) {
        await markExpired();
      }
      throw new BadRequestException('This invitation has expired');
    }
  }
}
