import type { TenantAdminInvitationProps, TenantMemberInvitationProps } from '../../domain/invitation.types.js';
import { MembershipRole } from '../../domain/membership.types.js';
import type {
  CreateTenantInvitationResponseDto,
  TenantInvitationResponseDto,
} from '../dto/response/invitation.response.dto.js';

export function toInvitationResponse(
  props: TenantAdminInvitationProps | TenantMemberInvitationProps,
  role: MembershipRole,
): TenantInvitationResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    email: props.email,
    role,
    status: props.status,
    expiresAt: props.expiresAt,
    acceptedAt: props.acceptedAt,
    invitedBy: props.invitedBy,
    createdAt: props.createdAt!,
  };
}

export function toCreateInvitationResponse(
  props: TenantAdminInvitationProps | TenantMemberInvitationProps,
  invitationToken: string,
  role: MembershipRole,
): CreateTenantInvitationResponseDto {
  return {
    ...toInvitationResponse(props, role),
    invitationToken,
  };
}
