import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';

@Entity({ name: 'roles', schema: DATABASE_SCHEMA })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'role_code', type: 'varchar', length: 50, unique: true })
  roleCode!: string;

  @Column({ name: 'role_name', type: 'varchar', length: 100 })
  roleName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ name: 'role_type', type: 'varchar', length: 30, default: 'SYSTEM' })
  roleType!: string;

  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId?: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.role)
  rolePermissions!: RolePermissionEntity[];
}

@Entity({ name: 'permissions', schema: DATABASE_SCHEMA })
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'permission_code', type: 'text', unique: true })
  permissionCode!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.permission)
  rolePermissions!: RolePermissionEntity[];
}

@Entity({ name: 'role_permissions', schema: DATABASE_SCHEMA })
export class RolePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'permission_id', type: 'uuid', nullable: true })
  permissionId?: string;

  @Column({ name: 'application_permission_id', type: 'uuid', nullable: true })
  applicationPermissionId?: string;

  @Column({ name: 'granted_at', type: 'timestamptz', default: () => 'now()' })
  grantedAt!: Date;

  @ManyToOne(() => RoleEntity, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @ManyToOne(() => PermissionEntity, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission?: PermissionEntity;
}

@Entity({ name: 'identity_roles', schema: DATABASE_SCHEMA })
export class IdentityRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'granted_at', type: 'timestamptz', default: () => 'now()' })
  grantedAt!: Date;

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy?: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
