import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginationMetaDto {
  @ApiPropertyOptional({ example: 42 })
  total!: number;

  @ApiPropertyOptional({ example: 1 })
  page!: number;

  @ApiPropertyOptional({ example: 20 })
  limit!: number;

  @ApiPropertyOptional({ example: 3 })
  totalPages!: number;
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMetaDto {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return { data, meta: buildPaginationMeta(total, page, limit) };
}
