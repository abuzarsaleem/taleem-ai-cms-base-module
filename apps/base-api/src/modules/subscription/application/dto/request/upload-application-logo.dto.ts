import { ApiProperty } from '@nestjs/swagger';

export class UploadApplicationLogoDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Application logo image' })
  file!: string;
}
