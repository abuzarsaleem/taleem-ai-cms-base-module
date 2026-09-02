import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PaginationQueryDto, PlatformPermission, RequirePermissions, type AuthenticatedUser } from '@app/common';
import { SubscriptionPlanService } from '../application/subscription-plan.service.js';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../application/dto/request/subscription.request.dto.js';
import {
  SubscriptionPlanListResponseDto,
  SubscriptionPlanResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(private readonly service: SubscriptionPlanService) {}

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Create a subscription plan' })
  @ApiCreatedResponse({ type: SubscriptionPlanResponseDto })
  create(@Body() dto: CreateSubscriptionPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List subscription plans' })
  @ApiOkResponse({ type: SubscriptionPlanListResponseDto })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query.page ?? 1, query.limit ?? 20);
  }

  @Get(':planId')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  findById(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.service.findById(planId);
  }

  @Patch(':planId')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Update a subscription plan',
    description: 'Changing limits does not automatically add or remove existing tenant entitlements.',
  })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  update(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(planId, dto, user.userId);
  }
}
