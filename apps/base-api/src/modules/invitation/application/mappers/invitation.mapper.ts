import type { TenantAdminInvitationProps } from '../../domain/invitation.types.js';
import type {
  CreateTenantAdminInvitationResponseDto,
  TenantAdminInvitationResponseDto,
} from '../dto/response/invitation.response.dto.js';

export function toInvitationResponse(
  props: TenantAdminInvitationProps,
): TenantAdminInvitationResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    email: props.email,
    status: props.status,
    expiresAt: props.expiresAt,
    acceptedAt: props.acceptedAt,
    invitedBy: props.invitedBy,
    createdAt: props.createdAt!,
  };
}

export function toCreateInvitationResponse(
  props: TenantAdminInvitationProps,
  invitationToken: string,
): CreateTenantAdminInvitationResponseDto {
  return {
    ...toInvitationResponse(props),
    invitationToken,
  };
}
