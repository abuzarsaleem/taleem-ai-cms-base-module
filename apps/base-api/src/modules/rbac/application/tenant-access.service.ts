import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TENANT_ROLE_PERMISSIONS,
  TenantRole,
  type TenantPermissionCode,
  type TenantRoleCode,
} from '@app/common';
import { TenantMembershipEntity } from '../../invitation/infrastructure/persistence/invitation.entities.js';
import { MembershipRole, MembershipStatus } from '../../invitation/domain/membership.types.js';

export interface TenantAccessProfile {
  tenantId: string;
  roles: TenantRoleCode[];
  permissions: TenantPermissionCode[];
  isActiveMember: boolean;
}

@Injectable()
export class TenantAccessService {
  constructor(
    @InjectRepository(TenantMembershipEntity)
    private readonly membershipRepository: Repository<TenantMembershipEntity>,
  ) {}

  async getAccess(userId: string, tenantId: string): Promise<TenantAccessProfile | null> {
    const membership = await this.membershipRepository.findOne({
      where: { tenantId, userId },
    });
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      return null;
    }

    const role =
      membership.role === MembershipRole.ADMIN ? TenantRole.ADMIN : TenantRole.MEMBER;
    const permissions = [...TENANT_ROLE_PERMISSIONS[role]];

    return {
      tenantId,
      roles: [role],
      permissions,
      isActiveMember: true,
    };
  }
}
