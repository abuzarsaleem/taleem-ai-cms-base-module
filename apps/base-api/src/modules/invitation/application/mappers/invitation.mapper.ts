import type { UserTokenProps } from '../../../auth/domain/user-token.types.js';
import { InvitationStatus } from '../../domain/invitation.types.js';
import { MembershipRole } from '../../domain/membership.types.js';
import type {
  CreateTenantInvitationResponseDto,
  TenantInvitationResponseDto,
} from '../dto/response/invitation.response.dto.js';

export function toInvitationResponse(props: UserTokenProps): TenantInvitationResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId!,
    email: props.email!,
    role: (props.membershipRole as MembershipRole) ?? MembershipRole.MEMBER,
    status: props.status as InvitationStatus,
    expiresAt: props.expiresAt,
    acceptedAt: props.usedAt,
    invitedBy: props.invitedBy!,
    createdAt: props.createdAt!,
  };
}

export function toCreateInvitationResponse(
  props: UserTokenProps,
  invitationToken: string,
): CreateTenantInvitationResponseDto {
  return {
    ...toInvitationResponse(props),
    invitationToken,
  };
}
