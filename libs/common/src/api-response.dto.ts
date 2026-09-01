import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'Tenant not found' })
  message!: string | string[];

  @ApiPropertyOptional({ example: 'Not Found' })
  error?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Resource deleted successfully' })
  message!: string;
}
