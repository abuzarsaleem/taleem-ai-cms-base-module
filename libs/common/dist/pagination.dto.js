var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
export class PaginationQueryDto {
    page = 1;
    limit = 20;
}
__decorate([
    ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number (1-based)' }),
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' }),
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "limit", void 0);
export class PaginationMetaDto {
    total;
    page;
    limit;
    totalPages;
}
__decorate([
    ApiPropertyOptional({ example: 42 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "total", void 0);
__decorate([
    ApiPropertyOptional({ example: 1 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "page", void 0);
__decorate([
    ApiPropertyOptional({ example: 20 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "limit", void 0);
__decorate([
    ApiPropertyOptional({ example: 3 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "totalPages", void 0);
export function buildPaginationMeta(total, page, limit) {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
    };
}
export function paginatedResponse(data, total, page, limit) {
    return { data, meta: buildPaginationMeta(total, page, limit) };
}
//# sourceMappingURL=pagination.dto.js.map