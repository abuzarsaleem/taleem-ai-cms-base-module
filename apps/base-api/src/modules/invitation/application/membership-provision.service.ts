import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IDENTITY_REPOSITORY } from '../../identity/domain/identity.repository.interface.js';
import type { IIdentityRepository } from '../../identity/domain/identity.repository.interface.js';
import { IdentityStatus, type IdentityProps } from '../../identity/domain/identity.types.js';
import { AuthenticationMethodService } from '../../identity/application/authentication-method.service.js';

export type ProvisionIdentityInput = {
  email: string;
  password?: string;
  fullName?: string;
  /** When true, password + fullName are always required (direct create APIs). */
  requireCredentials?: boolean;
};

/**
 * Creates or activates an identity with password credentials.
 * Shared by invitation accept and direct membership create APIs.
 */
@Injectable()
export class MembershipProvisionService {
  constructor(
    private readonly config: ConfigService,
    private readonly authMethods: AuthenticationMethodService,
    @Inject(IDENTITY_REPOSITORY) private readonly identities: IIdentityRepository,
  ) {}

  async provision(input: ProvisionIdentityInput): Promise<IdentityProps> {
    const email = input.email.toLowerCase().trim();
    const fullName = input.fullName?.trim();
    const password = input.password;
    const requireCredentials = input.requireCredentials === true;

    let identity = await this.identities.findByEmail(email);

    if (identity?.id) {
      if (!identity.passwordHash) {
        this.assertCredentials(password, fullName, 'activate this account');
        identity = await this.identities.update(identity.id, {
          passwordHash: await this.hashPassword(password!),
          emailVerified: true,
          fullName: fullName!,
          status: IdentityStatus.ACTIVE,
        });
      } else if (requireCredentials) {
        // Direct create for an existing account: attach membership only; keep password.
        if (identity.status !== IdentityStatus.ACTIVE) {
          identity = await this.identities.update(identity.id, {
            status: IdentityStatus.ACTIVE,
            emailVerified: true,
            fullName: identity.fullName?.trim() ? identity.fullName : fullName!,
          });
        }
      }
    } else {
      this.assertCredentials(
        password,
        fullName,
        requireCredentials ? 'create the account' : 'create your account',
      );
      identity = await this.identities.create({
        email,
        passwordHash: await this.hashPassword(password!),
        emailVerified: true,
        fullName: fullName!,
        status: IdentityStatus.ACTIVE,
      });
    }

    if (!identity.id) {
      throw new BadRequestException('Unable to provision user account');
    }

    await this.authMethods.ensurePassword(identity.id, email);
    return identity;
  }

  private assertCredentials(
    password: string | undefined,
    fullName: string | undefined,
    action: string,
  ) {
    if (!password) {
      throw new BadRequestException(`Password is required to ${action}`);
    }
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (!fullName) {
      throw new BadRequestException(`Full name is required to ${action}`);
    }
  }

  private hashPassword(password: string) {
    const saltRounds = this.config.get<number>('auth.bcryptSaltRounds', 12);
    return bcrypt.hash(password, saltRounds);
  }
}
