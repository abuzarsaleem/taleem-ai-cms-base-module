import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';

export class UserSessionResponseDto {
  @ApiProperty({ example: 'platform:uuid' }) id!: string;
  @ApiProperty({ enum: ['PLATFORM', 'OAUTH'] }) type!: 'PLATFORM' | 'OAUTH';
  @ApiProperty({ enum: ['ACTIVE'] }) status!: string;
  @ApiPropertyOptional() clientName?: string;
  @ApiPropertyOptional({ format: 'uuid' }) tenantId?: string;
  @ApiPropertyOptional() ipAddress?: string;
  @ApiPropertyOptional() userAgent?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() expiresAt!: Date;
  @ApiPropertyOptional() lastActivityAt?: Date;
}

export class UserSessionListResponseDto {
  @ApiProperty({ type: [UserSessionResponseDto] }) data!: UserSessionResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class RevokeSessionResponseDto {
  @ApiProperty() revoked!: boolean;
}

export class RevokeAllSessionsResponseDto {
  @ApiProperty() revokedCount!: number;
}
