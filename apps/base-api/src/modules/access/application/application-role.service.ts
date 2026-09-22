import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  APPLICATION_REPOSITORY,
  type IApplicationRepository,
} from '../../subscription/domain/subscription.repository.interface.js';
import {
  RoleEntity,
  RolePermissionEntity,
} from '../../rbac/infrastructure/persistence/rbac.entities.js';
import {
  ApplicationPermissionEntity,
  RoleType,
} from '../infrastructure/persistence/access.entities.js';
import type {
  AddApplicationRolePermissionsDto,
  ApplicationRoleResponseDto,
  CreateApplicationRoleDto,
  UpdateApplicationRoleDto,
} from './dto/access.dto.js';

@Injectable()
export class ApplicationRoleService {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: IApplicationRepository,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissions: Repository<RolePermissionEntity>,
    @InjectRepository(ApplicationPermissionEntity)
    private readonly appPermissions: Repository<ApplicationPermissionEntity>,
  ) {}

  async list(applicationId: string): Promise<ApplicationRoleResponseDto[]> {
    await this.requireApplication(applicationId);
    const roles = await this.roles.find({
      where: {
        applicationId,
        tenantId: IsNull(),
        roleType: RoleType.SYSTEM,
      },
      order: { roleCode: 'ASC' },
    });
    return Promise.all(roles.map((role) => this.toResponse(role)));
  }

  async get(applicationId: string, roleId: string): Promise<ApplicationRoleResponseDto> {
    const role = await this.requireApplicationRole(applicationId, roleId);
    return this.toResponse(role);
  }

  async assertRoleCodesAvailable(roleCodes: string[]): Promise<void> {
    const codes = [...new Set(roleCodes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
    if (!codes.length) return;

    const existing = await this.roles.find({ where: { roleCode: In(codes) } });
    if (existing.length) {
      throw new ConflictException(
        `Role code(s) already exist: ${existing.map((r) => r.roleCode).join(', ')}`,
      );
    }
  }

  async create(
    applicationId: string,
    dto: CreateApplicationRoleDto,
  ): Promise<ApplicationRoleResponseDto> {
    await this.requireApplication(applicationId);

    const existing = await this.roles.findOne({ where: { roleCode: dto.roleCode } });
    if (existing) {
      throw new ConflictException(`Role code '${dto.roleCode}' already exists`);
    }

    const permissionIds = dto.permissionIds ?? [];
    if (permissionIds.length) {
      await this.requirePermissionsBelongToApplication(applicationId, permissionIds);
    }

    const saved = await this.roles.save(
      this.roles.create({
        roleCode: dto.roleCode,
        roleName: dto.roleName,
        description: dto.description,
        isSystem: true,
        roleType: RoleType.SYSTEM,
        applicationId,
        tenantId: undefined,
      }),
    );

    if (permissionIds.length) {
      await this.insertRolePermissions(saved.id, permissionIds);
    }

    return this.toResponse(saved);
  }

  async update(
    applicationId: string,
    roleId: string,
    dto: UpdateApplicationRoleDto,
  ): Promise<ApplicationRoleResponseDto> {
    const role = await this.requireApplicationRole(applicationId, roleId);

    if (dto.roleName === undefined && dto.description === undefined) {
      throw new BadRequestException('Provide roleName and/or description to update');
    }

    if (dto.roleName !== undefined) role.roleName = dto.roleName;
    if (dto.description !== undefined) role.description = dto.description;

    return this.toResponse(await this.roles.save(role));
  }

  async addPermissions(
    applicationId: string,
    roleId: string,
    dto: AddApplicationRolePermissionsDto,
  ): Promise<ApplicationRoleResponseDto> {
    const role = await this.requireApplicationRole(applicationId, roleId);
    await this.requirePermissionsBelongToApplication(applicationId, dto.permissionIds);

    const existing = await this.rolePermissions.find({
      where: {
        roleId: role.id,
        applicationPermissionId: In(dto.permissionIds),
      },
    });
    const existingIds = new Set(
      existing
        .map((row) => row.applicationPermissionId)
        .filter((id): id is string => Boolean(id)),
    );
    const toAdd = dto.permissionIds.filter((id) => !existingIds.has(id));
    if (toAdd.length) {
      await this.insertRolePermissions(role.id, toAdd);
    }

    return this.toResponse(role);
  }

  async removePermission(
    applicationId: string,
    roleId: string,
    permissionId: string,
  ): Promise<ApplicationRoleResponseDto> {
    const role = await this.requireApplicationRole(applicationId, roleId);
    const permission = await this.appPermissions.findOne({
      where: { id: permissionId, applicationId },
    });
    if (!permission) {
      throw new NotFoundException(
        `Application permission '${permissionId}' not found for this application`,
      );
    }

    const link = await this.rolePermissions.findOne({
      where: { roleId: role.id, applicationPermissionId: permissionId },
    });
    if (!link) {
      throw new NotFoundException(
        `Permission '${permissionId}' is not assigned to role '${roleId}'`,
      );
    }

    await this.rolePermissions.delete(link.id);
    return this.toResponse(role);
  }

  private async requireApplication(applicationId: string) {
    const application = await this.applications.findById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application '${applicationId}' not found`);
    }
    return application;
  }

  private async requireApplicationRole(applicationId: string, roleId: string) {
    await this.requireApplication(applicationId);
    const role = await this.roles.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role '${roleId}' not found`);
    if (!role.applicationId || role.applicationId !== applicationId) {
      throw new NotFoundException(`Role '${roleId}' not found for this application`);
    }
    if (role.tenantId) {
      throw new BadRequestException('Tenant-scoped custom roles cannot be managed here');
    }
    return role;
  }

  private async requirePermissionsBelongToApplication(
    applicationId: string,
    permissionIds: string[],
  ) {
    const uniqueIds = [...new Set(permissionIds)];
    const rows = await this.appPermissions.find({
      where: { id: In(uniqueIds), applicationId },
    });
    if (rows.length !== uniqueIds.length) {
      throw new BadRequestException(
        'All permissionIds must be application permissions for this application',
      );
    }
    return rows;
  }

  private async insertRolePermissions(roleId: string, permissionIds: string[]) {
    await this.rolePermissions.save(
      permissionIds.map((applicationPermissionId) =>
        this.rolePermissions.create({
          roleId,
          applicationPermissionId,
          permissionId: undefined,
        }),
      ),
    );
  }

  private async permissionCodesForRole(roleId: string): Promise<string[]> {
    const rows = await this.appPermissions
      .createQueryBuilder('ap')
      .innerJoin(
        RolePermissionEntity,
        'rp',
        'rp.application_permission_id = ap.id AND rp.role_id = :roleId',
        { roleId },
      )
      .orderBy('ap.permission_code', 'ASC')
      .getMany();
    return rows.map((row) => row.permissionCode);
  }

  private async toResponse(role: RoleEntity): Promise<ApplicationRoleResponseDto> {
    return {
      id: role.id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      applicationId: role.applicationId!,
      roleType: role.roleType,
      permissionCodes: await this.permissionCodesForRole(role.id),
    };
  }
}
