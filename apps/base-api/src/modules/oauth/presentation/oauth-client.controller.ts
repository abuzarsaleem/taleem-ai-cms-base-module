import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto, PlatformPermission, RequirePermissions } from '@app/common';
import { OauthClientService } from '../application/oauth-client.service.js';
import { CreateOAuthClientDto } from '../application/dto/request/oauth.request.dto.js';
import {
  CreateOAuthClientResponseDto,
  OAuthClientResponseDto,
} from '../application/dto/response/oauth.response.dto.js';

@ApiTags('OAuth Clients')
@ApiBearerAuth()
@Controller('oauth/client')
export class OauthClientController {
  constructor(private readonly service: OauthClientService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List OAuth clients' })
  @ApiOkResponse({ type: [OAuthClientResponseDto] })
  async list(@Query() q: PaginationQueryDto) {
    const { data, total } = await this.service.list(q.page ?? 1, q.limit ?? 20);
    return {
      data: data.map((c) => ({
        id: c.id,
        applicationId: c.applicationId,
        clientId: c.clientId,
        clientName: c.clientName,
        clientType: c.clientType,
        status: c.status,
        redirectUris: c.redirectUris,
      })),
      meta: { total, page: q.page ?? 1, limit: q.limit ?? 20 },
    };
  }

  @Post()
  @RequirePermissions(PlatformPermission.TENANT_UPDATE)
  @ApiOperation({ summary: 'Register OAuth client for an application' })
  @ApiCreatedResponse({ type: CreateOAuthClientResponseDto })
  async create(@Body() dto: CreateOAuthClientDto) {
    const { client, plainSecret } = await this.service.createClient({
      applicationId: dto.application_id,
      clientId: dto.client_id,
      clientName: dto.client_name,
      clientType: dto.client_type,
      redirectUris: dto.redirect_uris,
      clientSecret: dto.client_secret,
    });
    return {
      id: client.id,
      applicationId: client.applicationId,
      clientId: client.clientId,
      clientName: client.clientName,
      clientType: client.clientType,
      status: client.status,
      redirectUris: client.redirectUris,
      clientSecret: plainSecret,
    };
  }
}
