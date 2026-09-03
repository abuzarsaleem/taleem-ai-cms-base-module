import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PaginationQueryDto, type AuthenticatedUser } from '@app/common';
import {
  RevokeAllSessionsResponseDto,
  RevokeSessionResponseDto,
  UserSessionListResponseDto,
} from '../application/dto/user-session.dto.js';
import { UserSessionService } from '../application/user-session.service.js';

@ApiTags('User Sessions')
@ApiBearerAuth()
@Controller('user/me/session')
export class UserSessionController {
  constructor(private readonly sessionService: UserSessionService) {}

  @Get()
  @ApiOperation({ summary: 'List active platform and OAuth sessions for current user' })
  @ApiOkResponse({ type: UserSessionListResponseDto })
  list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationQueryDto) {
    return this.sessionService.list(user.userId, pagination.page ?? 1, pagination.limit ?? 20);
  }

  @Delete(':sessionRef')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a session (id format: platform:uuid or oauth:uuid)' })
  @ApiOkResponse({ type: RevokeSessionResponseDto })
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('sessionRef') sessionRef: string) {
    return this.sessionService.revoke(user.userId, sessionRef);
  }

  @Post('revoke-all')
  @ApiOperation({ summary: 'Revoke all active sessions for current user' })
  @ApiOkResponse({ type: RevokeAllSessionsResponseDto })
  revokeAll(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionService.revokeAll(user.userId);
  }
}
