import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '@app/common';
import { RbacService } from '../../../rbac/application/rbac.service.js';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {
    const secret = configService.get<string>('jwt.accessSecret') ?? 'change-me-access-secret-min-32-chars';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const access = await this.rbacService.getUserAccess(payload.sub);
    return {
      userId: payload.sub,
      email: payload.email,
      roles: access.roles,
      permissions: access.permissions,
    };
  }
}
