import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import type {
  IAuthenticationMethodRepository,
  IIdentityRepository,
} from '../../domain/identity.repository.interface.js';
import {
  AuthenticationMethodStatus,
  CredentialStatus,
  CredentialType,
  IdentifierStatus,
  IdentifierType,
  IdentityStatus,
  IdentityType,
  type AuthenticationMethodProps,
  type IdentityListFilters,
  type IdentityProps,
} from '../../domain/identity.types.js';
import {
  AuthenticationMethodEntity,
  IdentityCredentialEntity,
  IdentityEntity,
  IdentityIdentifierEntity,
  IdentityProfileEntity,
} from './identity.entities.js';

const SCHEMA = `"${DATABASE_SCHEMA}"`;

/** Flattens the normalized identity tables back into a single row per identity. */
const IDENTITY_PROJECTION = `
  SELECT
    i.id,
    i.status,
    i.last_login_at,
    i.created_at,
    i.updated_at,
    p.display_name,
    p.first_name,
    p.last_name,
    p.profile_photo,
    em.identifier_value AS email,
    em.is_verified AS email_verified,
    cred.credential_reference AS password_hash
  FROM ${SCHEMA}.identities i
  LEFT JOIN ${SCHEMA}.identity_profiles p ON p.identity_id = i.id
  LEFT JOIN ${SCHEMA}.identity_identifiers em
    ON em.identity_id = i.id
   AND em.identifier_type = 'EMAIL'
   AND em.is_primary = TRUE
  LEFT JOIN ${SCHEMA}.identity_credentials cred
    ON cred.identity_id = i.id
   AND cred.credential_type = 'PASSWORD'
   AND cred.status = 'ACTIVE'
`;

@Injectable()
export class TypeOrmIdentityRepository implements IIdentityRepository {
  constructor(
    @InjectRepository(IdentityEntity)
    private readonly identities: Repository<IdentityEntity>,
    @InjectRepository(IdentityProfileEntity)
    private readonly profiles: Repository<IdentityProfileEntity>,
    @InjectRepository(IdentityIdentifierEntity)
    private readonly identifiers: Repository<IdentityIdentifierEntity>,
    @InjectRepository(IdentityCredentialEntity)
    private readonly credentials: Repository<IdentityCredentialEntity>,
  ) {}

  async findById(id: string): Promise<IdentityProps | null> {
    const rows = await this.identities.manager.query(
      `${IDENTITY_PROJECTION} WHERE i.id = $1`,
      [id],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<IdentityProps | null> {
    const rows = await this.identities.manager.query(
      `${IDENTITY_PROJECTION} WHERE em.identifier_value = $1`,
      [email.toLowerCase()],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findAll(page: number, limit: number, filters?: IdentityListFilters) {
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters?.email) {
      params.push(`%${filters.email.toLowerCase()}%`);
      where.push(`em.identifier_value ILIKE $${params.length}`);
    }
    if (filters?.status) {
      params.push(filters.status);
      where.push(`i.status = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [{ count }] = await this.identities.manager.query(
      `
      SELECT COUNT(*)::int AS count
      FROM ${SCHEMA}.identities i
      LEFT JOIN ${SCHEMA}.identity_identifiers em
        ON em.identity_id = i.id
       AND em.identifier_type = 'EMAIL'
       AND em.is_primary = TRUE
      ${whereSql}
      `,
      params,
    );

    params.push(limit, (page - 1) * limit);
    const rows = await this.identities.manager.query(
      `
      ${IDENTITY_PROJECTION}
      ${whereSql}
      ORDER BY i.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params,
    );

    return {
      data: rows.map((row: Record<string, unknown>) => this.toDomain(row)),
      total: Number(count),
    };
  }

  async create(props: IdentityProps): Promise<IdentityProps> {
    const identity = await this.identities.save(
      this.identities.create({
        id: props.id,
        identityType: IdentityType.PERSON,
        status: props.status ?? IdentityStatus.ACTIVE,
      }),
    );

    await this.profiles.save(
      this.profiles.create({
        identityId: identity.id,
        displayName: props.fullName,
        firstName: props.firstName ?? null,
        lastName: props.lastName ?? null,
        profilePhoto: props.avatarUrl ?? null,
      }),
    );

    await this.identifiers.save(
      this.identifiers.create({
        identityId: identity.id,
        identifierType: IdentifierType.EMAIL,
        identifierValue: props.email.toLowerCase(),
        isPrimary: true,
        isVerified: props.emailVerified ?? false,
        status: IdentifierStatus.ACTIVE,
      }),
    );

    if (props.passwordHash) {
      await this.credentials.save(
        this.credentials.create({
          identityId: identity.id,
          credentialType: CredentialType.PASSWORD,
          credentialReference: props.passwordHash,
          status: CredentialStatus.ACTIVE,
        }),
      );
    }

    const created = await this.findById(identity.id);
    if (!created) {
      throw new NotFoundException(`Identity '${identity.id}' not found after creation`);
    }
    return created;
  }

  async update(id: string, props: Partial<IdentityProps>): Promise<IdentityProps> {
    const identity = await this.identities.findOne({ where: { id } });
    if (!identity) {
      throw new NotFoundException(`Identity '${id}' not found`);
    }

    if (props.status !== undefined) {
      await this.identities.update({ id }, { status: props.status });
    }

    if (
      props.fullName !== undefined ||
      props.avatarUrl !== undefined ||
      props.firstName !== undefined ||
      props.lastName !== undefined
    ) {
      const profile = await this.profiles.findOne({ where: { identityId: id } });
      const patch = {
        ...(props.fullName !== undefined ? { displayName: props.fullName } : {}),
        ...(props.avatarUrl !== undefined ? { profilePhoto: props.avatarUrl } : {}),
        ...(props.firstName !== undefined ? { firstName: props.firstName } : {}),
        ...(props.lastName !== undefined ? { lastName: props.lastName } : {}),
      };
      if (profile) {
        await this.profiles.update({ id: profile.id }, patch);
      } else {
        await this.profiles.save(
          this.profiles.create({
            identityId: id,
            displayName: props.fullName ?? '',
            ...patch,
          }),
        );
      }
    }

    if (props.email !== undefined || props.emailVerified !== undefined) {
      const primaryEmail = await this.identifiers.findOne({
        where: {
          identityId: id,
          identifierType: IdentifierType.EMAIL,
          isPrimary: true,
        },
      });
      const patch = {
        ...(props.email !== undefined ? { identifierValue: props.email.toLowerCase() } : {}),
        ...(props.emailVerified !== undefined ? { isVerified: props.emailVerified } : {}),
      };
      if (primaryEmail) {
        await this.identifiers.update({ id: primaryEmail.id }, patch);
      } else if (props.email !== undefined) {
        await this.identifiers.save(
          this.identifiers.create({
            identityId: id,
            identifierType: IdentifierType.EMAIL,
            identifierValue: props.email.toLowerCase(),
            isPrimary: true,
            isVerified: props.emailVerified ?? false,
            status: IdentifierStatus.ACTIVE,
          }),
        );
      }
    }

    if (props.passwordHash !== undefined) {
      const credential = await this.credentials.findOne({
        where: { identityId: id, credentialType: CredentialType.PASSWORD },
      });
      if (credential) {
        await this.credentials.update(
          { id: credential.id },
          {
            credentialReference: props.passwordHash,
            status: CredentialStatus.ACTIVE,
          },
        );
      } else {
        await this.credentials.save(
          this.credentials.create({
            identityId: id,
            credentialType: CredentialType.PASSWORD,
            credentialReference: props.passwordHash,
            status: CredentialStatus.ACTIVE,
          }),
        );
      }
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`Identity '${id}' not found`);
    }
    return updated;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.identities.update({ id }, { lastLoginAt: new Date() });
  }

  private toDomain(row: Record<string, unknown>): IdentityProps {
    return {
      id: String(row.id),
      email: String(row.email ?? ''),
      passwordHash: (row.password_hash as string | null) ?? undefined,
      emailVerified: row.email_verified === true,
      fullName: String(row.display_name ?? ''),
      firstName: (row.first_name as string | null) ?? null,
      lastName: (row.last_name as string | null) ?? null,
      avatarUrl: (row.profile_photo as string | null) ?? null,
      status: row.status as IdentityStatus,
      lastLoginAt: (row.last_login_at as Date | null) ?? undefined,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }
}

@Injectable()
export class TypeOrmAuthenticationMethodRepository implements IAuthenticationMethodRepository {
  constructor(
    @InjectRepository(AuthenticationMethodEntity)
    private readonly repo: Repository<AuthenticationMethodEntity>,
  ) {}

  async findByIdentityAndType(identityId: string, methodType: string) {
    const row = await this.repo.findOne({ where: { identityId, methodType } });
    return row ? this.map(row) : null;
  }

  async findByProviderReference(methodType: string, providerReference: string) {
    const row = await this.repo.findOne({ where: { methodType, providerReference } });
    return row ? this.map(row) : null;
  }

  async upsert(props: AuthenticationMethodProps) {
    const existing = await this.repo.findOne({
      where: { identityId: props.identityId, methodType: props.methodType },
    });

    if (existing) {
      existing.status = props.status ?? AuthenticationMethodStatus.ACTIVE;
      if (props.providerReference !== undefined) {
        existing.providerReference = props.providerReference;
      }
      if (props.metadata !== undefined) {
        existing.metadata = props.metadata;
      }
      return this.map(await this.repo.save(existing));
    }

    const saved = await this.repo.save(
      this.repo.create({
        identityId: props.identityId,
        methodType: props.methodType,
        status: props.status ?? AuthenticationMethodStatus.ACTIVE,
        providerReference: props.providerReference ?? null,
        metadata: props.metadata ?? null,
      }),
    );
    return this.map(saved);
  }

  private map(entity: AuthenticationMethodEntity): AuthenticationMethodProps {
    return {
      id: entity.id,
      identityId: entity.identityId,
      methodType: entity.methodType,
      status: entity.status,
      providerReference: entity.providerReference,
      metadata: entity.metadata,
    };
  }
}
