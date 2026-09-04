import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../domain/invitation.repository.interface.js';
import { MembershipRole, MembershipStatus } from '../domain/membership.types.js';
import { UpdateTenantMembershipDto } from './dto/request/membership.request.dto.js';
import { toMembershipResponse, toUserTenantMembershipResponse } from './mappers/membership.mapper.js';

@Injectable()
export class TenantMembershipService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: ITenantMembershipRepository,
  ) {}

  async listForTenant(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.membershipRepo.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toMembershipResponse), total, page, limit);
  }

  async listAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      userId?: string;
      status?: string;
      role?: string;
      email?: string;
    },
  ) {
    const { data, total } = await this.membershipRepo.findAll(page, limit, filters);
    return paginatedResponse(data.map(toMembershipResponse), total, page, limit);
  }

  async getForTenant(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.membershipRepo.findById(tenantId, id);
    if (!row) throw new NotFoundException(`Membership '${id}' not found`);
    return toMembershipResponse(row);
  }

  async update(tenantId: string, id: string, dto: UpdateTenantMembershipDto, _actorUserId?: string) {
    if (dto.status === undefined && dto.isTenantAdmin === undefined) {
      throw new BadRequestException('Provide status and/or isTenantAdmin');
    }

    const membership = await this.membershipRepo.findById(tenantId, id);
    if (!membership) throw new NotFoundException(`Membership '${id}' not found`);

    if (dto.status !== undefined) {
      if (dto.status === MembershipStatus.INACTIVE) {
        throw new BadRequestException(
          'Use DELETE to remove a membership; set status to SUSPENDED to temporarily disable access',
        );
      }
      await this.membershipRepo.updateStatus(tenantId, id, dto.status);
    }

    if (dto.isTenantAdmin !== undefined) {
      await this.updateAdminRole(tenantId, membership.userId, dto.isTenantAdmin);
    }

    return toMembershipResponse((await this.membershipRepo.findById(tenantId, id))!);
  }

  async remove(tenantId: string, id: string, _revokedBy?: string) {
    const membership = await this.membershipRepo.findById(tenantId, id);
    if (!membership) throw new NotFoundException(`Membership '${id}' not found`);

    if (membership.isTenantAdmin) {
      const adminCount = await this.membershipRepo.countActiveAdmins(tenantId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last tenant administrator');
      }
    }

    await this.membershipRepo.delete(tenantId, id);
  }

  async listForCurrentUser(userId: string, page: number, limit: number) {
    const { data, total } = await this.membershipRepo.findByUser(userId, page, limit);
    return paginatedResponse(data.map(toUserTenantMembershipResponse), total, page, limit);
  }

  private async updateAdminRole(tenantId: string, userId: string, isTenantAdmin: boolean) {
    if (isTenantAdmin) {
      await this.membershipRepo.updateRole(tenantId, userId, MembershipRole.ADMIN);
      return;
    }

    const current = await this.membershipRepo.findByTenantAndUser(tenantId, userId);
    if (!current || current.role !== MembershipRole.ADMIN) {
      return;
    }

    const adminCount = await this.membershipRepo.countActiveAdmins(tenantId);
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot demote the last tenant administrator');
    }

    await this.membershipRepo.updateRole(tenantId, userId, MembershipRole.MEMBER);
  }
}
