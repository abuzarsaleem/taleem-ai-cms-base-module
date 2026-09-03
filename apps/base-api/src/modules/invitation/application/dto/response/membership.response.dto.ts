import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';
import { MembershipRole, MembershipStatus } from '../../../domain/membership.types.js';

export class TenantMembershipResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: MembershipStatus }) status!: string;
  @ApiProperty({ enum: MembershipRole }) role!: string;
  @ApiProperty() joinedAt!: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty() userEmail!: string;
  @ApiProperty() userFullName!: string;
  @ApiProperty({ description: 'Derived from role === TENANT_ADMIN' }) isTenantAdmin!: boolean;
}

export class TenantMembershipListResponseDto {
  @ApiProperty({ type: [TenantMembershipResponseDto] })
  data!: TenantMembershipResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class UserTenantMembershipResponseDto {
  @ApiProperty({ format: 'uuid' }) membershipId!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() tenantCode!: string;
  @ApiProperty() tenantDisplayName!: string;
  @ApiProperty() tenantStatus!: string;
  @ApiProperty({ enum: MembershipStatus }) membershipStatus!: string;
  @ApiProperty({ enum: MembershipRole }) role!: string;
  @ApiProperty() joinedAt!: Date;
  @ApiProperty({ description: 'Derived from role === TENANT_ADMIN' }) isTenantAdmin!: boolean;
}

export class UserTenantMembershipListResponseDto {
  @ApiProperty({ type: [UserTenantMembershipResponseDto] })
  data!: UserTenantMembershipResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
