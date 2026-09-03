import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PaginationQueryDto,
  PlatformPermission,
  PlatformRole,
  RequirePermissions,
  type AuthenticatedUser,
  type PlatformRoleCode,
} from '@app/common';
import { PlatformUserService } from '../application/platform-user.service.js';
import {
  AssignPlatformRoleDto,
  PlatformUserDetailDto,
  PlatformUserListResponseDto,
  PlatformUserRolesResponseDto,
  UpdatePlatformUserDto,
} from '../application/dto/platform-user.dto.js';

@ApiTags('Platform Users')
@ApiBearerAuth()
@Controller('platform/user')
export class PlatformUserController {
  constructor(private readonly service: PlatformUserService) {}

  @Get()
  @RequirePermissions(PlatformPermission.USER_READ)
  @ApiOperation({ summary: 'List platform users' })
  @ApiOkResponse({ type: PlatformUserListResponseDto })
  list(@Query() pagination: PaginationQueryDto, @Query('email') email?: string) {
    return this.service.list(pagination.page ?? 1, pagination.limit ?? 20, email);
  }

  @Get(':userId')
  @RequirePermissions(PlatformPermission.USER_READ)
  @ApiOperation({ summary: 'Get platform user by ID' })
  @ApiOkResponse({ type: PlatformUserDetailDto })
  get(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.getById(userId);
  }

  @Patch(':userId')
  @RequirePermissions(PlatformPermission.USER_MANAGE)
  @ApiOperation({ summary: 'Update platform user status' })
  @ApiOkResponse({ type: PlatformUserDetailDto })
  update(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: UpdatePlatformUserDto) {
    return this.service.update(userId, dto);
  }

  @Get(':userId/role')
  @RequirePermissions(PlatformPermission.USER_READ)
  @ApiOperation({ summary: 'List platform roles assigned to a user' })
  @ApiOkResponse({ type: PlatformUserRolesResponseDto })
  listRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.listRoles(userId);
  }

  @Post(':userId/role')
  @RequirePermissions(PlatformPermission.USER_MANAGE)
  @ApiOperation({ summary: 'Assign a platform role to a user' })
  @ApiOkResponse({ type: PlatformUserRolesResponseDto })
  assignRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AssignPlatformRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.assignRole(userId, dto, actor.userId);
  }

  @Delete(':userId/role/:roleCode')
  @RequirePermissions(PlatformPermission.USER_MANAGE)
  @ApiOperation({ summary: 'Revoke a platform role from a user' })
  @ApiOkResponse({ type: PlatformUserRolesResponseDto })
  revokeRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleCode') roleCode: string,
  ) {
    if (!Object.values(PlatformRole).includes(roleCode as PlatformRoleCode)) {
      throw new BadRequestException(`Invalid platform role code '${roleCode}'`);
    }
    return this.service.revokeRole(userId, roleCode as PlatformRoleCode);
  }
}
