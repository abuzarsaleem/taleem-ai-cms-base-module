import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import {
  AuthenticationMethodStatus,
  CredentialStatus,
  CredentialType,
  IdentifierStatus,
  IdentifierType,
  IdentityStatus,
  IdentityType,
} from '../../domain/identity.types.js';

@Entity({ name: 'identities', schema: DATABASE_SCHEMA })
export class IdentityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_type', type: 'varchar', length: 30, default: IdentityType.PERSON })
  identityType!: IdentityType;

  @Column({ type: 'varchar', length: 30, default: IdentityStatus.ACTIVE })
  status!: IdentityStatus;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'identity_profiles', schema: DATABASE_SCHEMA })
export class IdentityProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_id', type: 'uuid', unique: true })
  identityId!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName?: string | null;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string | null;

  @Column({ name: 'display_name', type: 'varchar', length: 150 })
  displayName!: string;

  @Column({ name: 'profile_photo', type: 'varchar', length: 1000, nullable: true })
  profilePhoto?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'identity_identifiers', schema: DATABASE_SCHEMA })
export class IdentityIdentifierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ name: 'identifier_type', type: 'varchar', length: 30 })
  identifierType!: IdentifierType;

  @Column({ name: 'identifier_value', type: 'citext' })
  identifierValue!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'varchar', length: 30, default: IdentifierStatus.ACTIVE })
  status!: IdentifierStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'identity_credentials', schema: DATABASE_SCHEMA })
export class IdentityCredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ name: 'credential_type', type: 'varchar', length: 30 })
  credentialType!: CredentialType;

  /** For PASSWORD credentials this holds the bcrypt hash. */
  @Column({ name: 'credential_reference', type: 'varchar', length: 255 })
  credentialReference!: string;

  @Column({ type: 'varchar', length: 30, default: CredentialStatus.ACTIVE })
  status!: CredentialStatus;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'authentication_methods', schema: DATABASE_SCHEMA })
export class AuthenticationMethodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ name: 'method_type', type: 'varchar', length: 50 })
  methodType!: string;

  @Column({ type: 'varchar', length: 30, default: AuthenticationMethodStatus.ACTIVE })
  status!: string;

  @Column({ name: 'provider_reference', type: 'varchar', length: 255, nullable: true })
  providerReference?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'identity_sessions', schema: DATABASE_SCHEMA })
export class IdentitySessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ name: 'session_reference', type: 'varchar', length: 255, unique: true })
  sessionReference!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'last_activity_at', type: 'timestamptz', default: () => 'now()' })
  lastActivityAt!: Date;
}
