import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformRole, paginatedResponse } from '@app/common';
import type { PlatformRoleCode } from '@app/common';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { UserStatus } from '../../user/domain/user.types.js';
import { RoleEntity, UserRoleEntity } from '../infrastructure/persistence/rbac.entities.js';
import { RbacService } from './rbac.service.js';
import type { AssignPlatformRoleDto, UpdatePlatformUserDto } from './dto/platform-user.dto.js';

const ASSIGNABLE_PLATFORM_ROLES = new Set<string>([
  PlatformRole.ADMIN,
  PlatformRole.SUPPORT,
]);

@Injectable()
export class PlatformUserService {
  constructor(
    private readonly rbacService: RbacService,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async list(page: number, limit: number, email?: string) {
    const { data, total } = await this.userRepository.findAll(page, limit, { email });
    const users = await Promise.all(
      data.map(async (user) => ({
        id: user.id!,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified ?? false,
        status: user.status!,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt!,
        roles: (await this.rbacService.getUserAccess(user.id!)).roles,
      })),
    );
    return paginatedResponse(users, total, page, limit);
  }

  async getById(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.id) {
      throw new NotFoundException(`User '${userId}' not found`);
    }
    const access = await this.rbacService.getUserAccess(userId);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified ?? false,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: access.roles,
      permissions: access.permissions,
    };
  }

  async update(userId: string, dto: UpdatePlatformUserDto) {
    await this.getById(userId);
    if (dto.status === UserStatus.INACTIVE) {
      throw new BadRequestException('Use SUSPENDED instead of INACTIVE for platform users');
    }
    await this.userRepository.update(userId, { status: dto.status });
    return this.getById(userId);
  }

  async listRoles(userId: string) {
    await this.getById(userId);
    const access = await this.rbacService.getUserAccess(userId);
    return { userId, roles: access.roles };
  }

  async assignRole(userId: string, dto: AssignPlatformRoleDto, grantedBy?: string) {
    if (!ASSIGNABLE_PLATFORM_ROLES.has(dto.roleCode)) {
      throw new BadRequestException(`Role '${dto.roleCode}' cannot be assigned via platform API`);
    }

    await this.getById(userId);
    const role = await this.roleRepository.findOne({ where: { roleCode: dto.roleCode } });
    if (!role) {
      throw new NotFoundException(`Role '${dto.roleCode}' not found`);
    }

    const existing = await this.userRoleRepository.findOne({
      where: { userId, roleId: role.id },
    });
    if (existing) {
      throw new ConflictException(`User already has role '${dto.roleCode}'`);
    }

    await this.userRoleRepository.save(
      this.userRoleRepository.create({ userId, roleId: role.id, grantedBy }),
    );

    return this.listRoles(userId);
  }

  async revokeRole(userId: string, roleCode: PlatformRoleCode) {
    if (!ASSIGNABLE_PLATFORM_ROLES.has(roleCode)) {
      throw new BadRequestException(`Role '${roleCode}' cannot be revoked via platform API`);
    }

    await this.getById(userId);
    const role = await this.roleRepository.findOne({ where: { roleCode } });
    if (!role) {
      throw new NotFoundException(`Role '${roleCode}' not found`);
    }

    const result = await this.userRoleRepository.delete({ userId, roleId: role.id });
    if (!result.affected) {
      throw new NotFoundException(`User does not have role '${roleCode}'`);
    }

    return this.listRoles(userId);
  }
}
