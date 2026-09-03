import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { PaginationMetaDto, PlatformRole, type PlatformRoleCode } from '@app/common';
import { UserStatus } from '../../../user/domain/user.types.js';

export class PlatformUserSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() emailVerified!: boolean;
  @ApiProperty({ enum: UserStatus }) status!: UserStatus;
  @ApiPropertyOptional() lastLoginAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ type: [String] }) roles!: string[];
}

export class PlatformUserListResponseDto {
  @ApiProperty({ type: [PlatformUserSummaryDto] }) data!: PlatformUserSummaryDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class PlatformUserDetailDto extends PlatformUserSummaryDto {
  @ApiPropertyOptional() updatedAt?: Date;
  @ApiProperty({ type: [String] }) permissions!: string[];
}

export class UpdatePlatformUserDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED] })
  @IsIn([UserStatus.ACTIVE, UserStatus.SUSPENDED])
  status!: UserStatus;
}

export class AssignPlatformRoleDto {
  @ApiProperty({ enum: PlatformRole, example: PlatformRole.SUPPORT })
  @IsIn(Object.values(PlatformRole))
  roleCode!: PlatformRoleCode;
}

export class PlatformUserRolesResponseDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ type: [String] }) roles!: string[];
}

export class ListPlatformUsersQueryDto {
  @ApiPropertyOptional({ description: 'Filter by email substring' })
  email?: string;
}
