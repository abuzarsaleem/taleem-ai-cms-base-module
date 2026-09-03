import type {
  TenantMembershipDetailProps,
  UserTenantMembershipProps,
} from '../../domain/invitation.repository.interface.js';
import type {
  TenantMembershipResponseDto,
  UserTenantMembershipResponseDto,
} from '../dto/response/membership.response.dto.js';

export function toMembershipResponse(props: TenantMembershipDetailProps): TenantMembershipResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    userId: props.userId,
    status: String(props.status),
    role: String(props.role ?? 'TENANT_MEMBER'),
    joinedAt: props.joinedAt!,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,
    userEmail: props.userEmail,
    userFullName: props.userFullName,
    isTenantAdmin: props.isTenantAdmin,
  };
}

export function toUserTenantMembershipResponse(
  props: UserTenantMembershipProps,
): UserTenantMembershipResponseDto {
  return { ...props };
}
