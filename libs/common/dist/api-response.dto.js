var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ApiErrorResponseDto {
    statusCode;
    message;
    error;
}
__decorate([
    ApiProperty({ example: 404 }),
    __metadata("design:type", Number)
], ApiErrorResponseDto.prototype, "statusCode", void 0);
__decorate([
    ApiProperty({ example: 'Tenant not found' }),
    __metadata("design:type", Object)
], ApiErrorResponseDto.prototype, "message", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Not Found' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "error", void 0);
export class MessageResponseDto {
    message;
}
__decorate([
    ApiProperty({ example: 'Resource deleted successfully' }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "message", void 0);
//# sourceMappingURL=api-response.dto.js.map