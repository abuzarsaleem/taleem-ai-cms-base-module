import { ApiProperty } from '@nestjs/swagger';

/**
 * Invitation accept confirms membership + password setup only.
 * Clients must sign in separately — no session tokens are returned.
 */
export class AcceptInvitationResponseDto {
  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty()
  email!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({
    example: 'Password saved. Sign in with your email and password to continue.',
  })
  message!: string;
}
