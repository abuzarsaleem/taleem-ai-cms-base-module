import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationMetaDto } from '@app/common';

export class AuditEventQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ example: 'OAUTH_TOKEN_ISSUED' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AuditEventResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ format: 'uuid' }) tenantId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) actorUserId?: string;
  @ApiProperty() action!: string;
  @ApiPropertyOptional() entityType?: string;
  @ApiPropertyOptional({ format: 'uuid' }) entityId?: string;
  @ApiPropertyOptional() oldValue?: Record<string, unknown> | null;
  @ApiPropertyOptional() newValue?: Record<string, unknown> | null;
  @ApiPropertyOptional() ipAddress?: string;
  @ApiProperty() createdAt!: Date;
}

export class AuditEventListResponseDto {
  @ApiProperty({ type: [AuditEventResponseDto] }) data!: AuditEventResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class AuditEventSearchInput {
  tenantId?: string;
  actorUserId?: string;
  action?: string;
  from?: Date;
  to?: Date;

  static fromQuery(query: AuditEventQueryDto): AuditEventSearchInput {
    return {
      tenantId: query.tenantId,
      actorUserId: query.actorUserId,
      action: query.action,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
  }
}
