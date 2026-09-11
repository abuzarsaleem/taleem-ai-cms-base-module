import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/**
 * Protects machine-to-machine public endpoints (e.g. registration tenant catalog).
 * Expects header: x-api-key: <PUBLIC_REGISTRATION_API_KEY>
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('auth.publicRegistrationApiKey')?.trim();
    if (!expected) {
      throw new UnauthorizedException(
        'PUBLIC_REGISTRATION_API_KEY is not configured on the API',
      );
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided =
      (req.headers['x-api-key'] as string | undefined)?.trim() ||
      (typeof req.headers.authorization === 'string' &&
      req.headers.authorization.toLowerCase().startsWith('apikey ')
        ? req.headers.authorization.slice(7).trim()
        : undefined);

    if (!provided || !safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
