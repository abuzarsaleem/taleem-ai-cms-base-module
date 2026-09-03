import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  APPLICATION_SCOPE_REPOSITORY,
  OAUTH_CLIENT_REPOSITORY,
  type IApplicationScopeRepository,
  type IOAuthClientRepository,
  type OAuthClientProps,
} from '../domain/oauth.repository.interface.js';
import { OAuthClientType } from '../domain/oauth.types.js';
import { parseScopeString } from './oauth-token.util.js';

@Injectable()
export class OauthClientService {
  constructor(
    private readonly config: ConfigService,
    @Inject(OAUTH_CLIENT_REPOSITORY) private readonly clientRepo: IOAuthClientRepository,
    @Inject(APPLICATION_SCOPE_REPOSITORY) private readonly scopeRepo: IApplicationScopeRepository,
  ) {}

  async getActiveClient(clientId: string): Promise<OAuthClientProps> {
    const client = await this.clientRepo.findByClientId(clientId);
    if (!client || client.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid client_id');
    }
    return client;
  }

  validateRedirectUri(client: OAuthClientProps, redirectUri: string) {
    if (!client.redirectUris.includes(redirectUri)) {
      throw new BadRequestException('Invalid redirect_uri');
    }
  }

  async validateScopes(client: OAuthClientProps, scope?: string) {
    const scopes = scope ? parseScopeString(scope) : [];
    if (scopes.length === 0) return '';
    const valid = await this.scopeRepo.validateScopes(client.applicationId, scopes);
    if (!valid) throw new BadRequestException('Invalid scope');
    return scopes.join(' ');
  }

  async validateClientAuth(client: OAuthClientProps, clientSecret?: string) {
    if (client.clientType === OAuthClientType.CONFIDENTIAL) {
      if (!clientSecret || !client.clientSecretHash) {
        throw new UnauthorizedException('client_secret required');
      }
      const valid = await bcrypt.compare(clientSecret, client.clientSecretHash);
      if (!valid) throw new UnauthorizedException('Invalid client credentials');
    }
  }

  async listScopes(applicationId: string) {
    return this.scopeRepo.findActiveByApplication(applicationId);
  }

  async createClient(dto: {
    applicationId: string;
    clientId: string;
    clientName: string;
    clientType: string;
    redirectUris: string[];
    clientSecret?: string;
  }) {
    if (dto.clientType === OAuthClientType.CONFIDENTIAL && !dto.clientSecret) {
      throw new BadRequestException('client_secret is required for CONFIDENTIAL clients');
    }
    const saltRounds = this.config.get<number>('auth.bcryptSaltRounds', 12);
    const clientSecretHash =
      dto.clientType === OAuthClientType.CONFIDENTIAL
        ? await bcrypt.hash(dto.clientSecret!, saltRounds)
        : undefined;

    const client = await this.clientRepo.create({
      applicationId: dto.applicationId,
      clientId: dto.clientId,
      clientName: dto.clientName,
      clientType: dto.clientType,
      status: 'ACTIVE',
      redirectUris: dto.redirectUris,
      clientSecretHash,
    });

    return { client, plainSecret: dto.clientSecret };
  }

  list(page: number, limit: number) {
    return this.clientRepo.list(page, limit);
  }
}
