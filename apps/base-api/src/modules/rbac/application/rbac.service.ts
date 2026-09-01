import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleEntity } from '../infrastructure/persistence/rbac.entities.js';

export interface UserAccessProfile {
  roles: string[];
  permissions: string[];
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async getUserAccess(userId: string): Promise<UserAccessProfile> {
    const assignments = await this.userRoleRepository.find({
      where: { userId },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });

    const roles = new Set<string>();
    const permissions = new Set<string>();

    for (const assignment of assignments) {
      roles.add(assignment.role.roleCode);
      for (const rp of assignment.role.rolePermissions ?? []) {
        permissions.add(rp.permission.permissionCode);
      }
    }

    return {
      roles: [...roles].sort(),
      permissions: [...permissions].sort(),
    };
  }
}
