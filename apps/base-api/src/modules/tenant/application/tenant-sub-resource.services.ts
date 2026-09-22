import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { UploadedAssetFile } from './uploaded-asset-file.js';
import { DATABASE_SCHEMA, paginatedResponse } from '@app/common';
import { TenantContextService } from './tenant-context.service.js';
import { TenantCatalogService } from './tenant-catalog.service.js';
import type {
  IInstitutionProfileRepository,
  ITenantAddressRepository,
  ITenantAssetRepository,
  ITenantConfigurationRepository,
  ITenantContactRepository,
  ITenantIdentifierRepository,
  ITenantSmtpRepository,
} from '../domain/tenant.repository.interface.js';
import {
  INSTITUTION_PROFILE_REPOSITORY,
  TENANT_ADDRESS_REPOSITORY,
  TENANT_ASSET_REPOSITORY,
  TENANT_CONFIGURATION_REPOSITORY,
  TENANT_CONTACT_REPOSITORY,
  TENANT_IDENTIFIER_REPOSITORY,
  TENANT_SMTP_REPOSITORY,
} from '../domain/tenant.repository.interface.js';
import {
  FILE_STORAGE,
  type IFileStorageService,
} from '../../storage/domain/storage.service.interface.js';
import {
  AssetType,
  ContactType,
  TenantSetupProgressStatus,
  TenantStatus,
} from '../domain/tenant.types.js';
import type { TenantAssetProps } from '../domain/tenant.repository.interface.js';
import {
  assertValidAssetUpload,
  extensionForMimeType,
  sanitizeOriginalName,
} from './asset-upload.validation.js';
import {
  CreateInstitutionProfileDto,
  CreateTenantAddressDto,
  CreateTenantAssetDto,
  CreateTenantConfigurationDto,
  CreateTenantContactDto,
  CreateTenantIdentifierDto,
  CreateTenantSmtpDto,
  UpdateInstitutionProfileDto,
  UpdateTenantAddressDto,
  UpdateTenantAssetDto,
  UpdateTenantConfigurationDto,
  UpdateTenantContactDto,
  UpdateTenantIdentifierDto,
  UpdateTenantSmtpDto,
} from './dto/request/tenant.request.dto.js';
import type { PlatformConfigurationFilters } from './dto/request/platform-list.query.dto.js';
import type { TenantConfigurationResponseDto } from './dto/response/tenant.response.dto.js';
import {
  toAddressResponse,
  toAssetResponse,
  toConfigurationResponse,
  toContactResponse,
  toIdentifierResponse,
  toInstitutionProfileResponse,
  toSmtpResponse,
} from './mappers/tenant.mapper.js';

@Injectable()
export class TenantContactService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_CONTACT_REPOSITORY) private readonly repo: ITenantContactRepository,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.repo.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toContactResponse), total, page, limit);
  }

  async listAll(page: number, limit: number, filters?: {
    tenantId?: string;
    contactType?: string;
    email?: string;
    search?: string;
    isActive?: boolean;
    isPrimary?: boolean;
  }) {
    const { data, total } = await this.repo.findAll(page, limit, filters);
    return paginatedResponse(data.map(toContactResponse), total, page, limit);
  }

  async get(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findById(tenantId, id);
    if (!row) throw new NotFoundException(`Contact '${id}' not found`);
    return toContactResponse(row);
  }

  async create(tenantId: string, dto: CreateTenantContactDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    return toContactResponse(await this.repo.create({ ...dto, tenantId }));
  }

  async update(tenantId: string, id: string, dto: UpdateTenantContactDto) {
    return toContactResponse(await this.repo.update(tenantId, id, dto));
  }

  async delete(tenantId: string, id: string) {
    await this.repo.delete(tenantId, id);
  }
}

@Injectable()
export class TenantAddressService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_ADDRESS_REPOSITORY) private readonly repo: ITenantAddressRepository,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.repo.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toAddressResponse), total, page, limit);
  }

  async listAll(page: number, limit: number, filters?: {
    tenantId?: string;
    addressType?: string;
    city?: string;
    countryCode?: string;
    isActive?: boolean;
  }) {
    const { data, total } = await this.repo.findAll(page, limit, filters);
    return paginatedResponse(data.map(toAddressResponse), total, page, limit);
  }

  async get(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findById(tenantId, id);
    if (!row) throw new NotFoundException(`Address '${id}' not found`);
    return toAddressResponse(row);
  }

  async create(tenantId: string, dto: CreateTenantAddressDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    return toAddressResponse(await this.repo.create({ ...dto, tenantId }));
  }

  async update(tenantId: string, id: string, dto: UpdateTenantAddressDto) {
    return toAddressResponse(await this.repo.update(tenantId, id, dto));
  }

  async delete(tenantId: string, id: string) {
    await this.repo.delete(tenantId, id);
  }
}

@Injectable()
export class TenantIdentifierService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly catalogService: TenantCatalogService,
    @Inject(TENANT_IDENTIFIER_REPOSITORY) private readonly repo: ITenantIdentifierRepository,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.repo.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toIdentifierResponse), total, page, limit);
  }

  async listAll(page: number, limit: number, filters?: {
    tenantId?: string;
    identifierType?: string;
    identifierValue?: string;
    isVerified?: boolean;
  }) {
    const { data, total } = await this.repo.findAll(page, limit, filters);
    return paginatedResponse(data.map(toIdentifierResponse), total, page, limit);
  }

  async get(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findById(tenantId, id);
    if (!row) throw new NotFoundException(`Identifier '${id}' not found`);
    return toIdentifierResponse(row);
  }

  async create(tenantId: string, dto: CreateTenantIdentifierDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    await this.assertIdentifierType(dto.identifierType);
    return toIdentifierResponse(
      await this.repo.create({
        ...dto,
        identifierType: dto.identifierType.toUpperCase(),
        tenantId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      }),
    );
  }

  async update(tenantId: string, id: string, dto: UpdateTenantIdentifierDto) {
    if (dto.identifierType) {
      await this.assertIdentifierType(dto.identifierType);
    }
    const updates = {
      ...dto,
      identifierType: dto.identifierType?.toUpperCase(),
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    };
    return toIdentifierResponse(await this.repo.update(tenantId, id, updates));
  }

  async delete(tenantId: string, id: string) {
    await this.repo.delete(tenantId, id);
  }

  private async assertIdentifierType(code: string) {
    const found = await this.catalogService.findIdentifierType(code);
    if (!found) {
      throw new BadRequestException(
        `Unknown identifier type '${code}'. Use GET /catalog/identifier-type for valid codes.`,
      );
    }
  }
}

@Injectable()
export class TenantConfigurationService {
  private static readonly REQUIRED_STEPS = 4;

  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_CONFIGURATION_REPOSITORY) private readonly repo: ITenantConfigurationRepository,
    @Inject(TENANT_ASSET_REPOSITORY) private readonly assetRepo: ITenantAssetRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async get(tenantId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findByTenantId(tenantId);
    if (!row) throw new NotFoundException(`Configuration for tenant '${tenantId}' not found`);
    return toConfigurationResponse(row);
  }

  /**
   * Platform list: every non-retired tenant with optional configuration row
   * and setup progress (identifier, primary contact, SMTP, address).
   */
  async listAll(page: number, limit: number, filters?: PlatformConfigurationFilters) {
    const params: unknown[] = [];
    const where: string[] = [`t.status <> '${TenantStatus.RETIRED}'`];

    if (filters?.tenantId) {
      params.push(filters.tenantId);
      where.push(`t.id = $${params.length}`);
    }
    if (filters?.status) {
      params.push(filters.status);
      where.push(`t.status = $${params.length}`);
    }
    if (filters?.timezone) {
      params.push(filters.timezone);
      where.push(`cfg.timezone = $${params.length}`);
    }
    if (filters?.locale) {
      params.push(filters.locale);
      where.push(`cfg.locale = $${params.length}`);
    }
    if (filters?.currencyCode) {
      params.push(filters.currencyCode.toUpperCase());
      where.push(`UPPER(cfg.currency_code) = $${params.length}`);
    }
    if (filters?.search?.trim()) {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      where.push(`(
        lower(t.display_name) LIKE $${params.length}
        OR lower(t.tenant_code) LIKE $${params.length}
        OR lower(coalesce(t.website_url, '')) LIKE $${params.length}
      )`);
    }

    const checklistSql = this.checklistSelectSql();
    const outerWhere: string[] = [];
    if (filters?.progressStatus) {
      outerWhere.push(this.progressStatusPredicate(filters.progressStatus, 'row'));
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const outerWhereSql = outerWhere.length ? `WHERE ${outerWhere.join(' AND ')}` : '';

    params.push(limit, (page - 1) * limit);

    const rows = await this.dataSource.query(
      `
      SELECT * FROM (
        SELECT
          t.id AS tenant_id,
          t.tenant_code,
          t.display_name,
          t.website_url,
          t.status AS tenant_status,
          t.updated_at AS tenant_updated_at,
          cfg.id AS configuration_id,
          cfg.timezone,
          cfg.locale,
          cfg.date_format,
          cfg.currency_code,
          cfg.branding_name,
          cfg.logo_asset_id,
          cfg.logo_dark_asset_id,
          cfg.favicon_asset_id,
          cfg.primary_color,
          cfg.secondary_color,
          cfg.accent_color,
          cfg.font_family,
          cfg.email_from_name,
          cfg.email_from_address,
          cfg.support_email,
          cfg.created_at AS configuration_created_at,
          cfg.updated_at AS configuration_updated_at,
          ${checklistSql}
        FROM "${DATABASE_SCHEMA}".tenants t
        LEFT JOIN "${DATABASE_SCHEMA}".tenant_configurations cfg ON cfg.tenant_id = t.id
        ${whereSql}
      ) row
      ${outerWhereSql}
      ORDER BY COALESCE(row.configuration_updated_at, row.tenant_updated_at) DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params,
    );

    const countParams = params.slice(0, -2);
    const [{ count }] = await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS count FROM (
        SELECT
          t.id,
          ${checklistSql}
        FROM "${DATABASE_SCHEMA}".tenants t
        LEFT JOIN "${DATABASE_SCHEMA}".tenant_configurations cfg ON cfg.tenant_id = t.id
        ${whereSql}
      ) row
      ${outerWhereSql}
      `,
      countParams,
    );

    return paginatedResponse(
      rows.map((row: Record<string, unknown>) => this.mapListRow(row)),
      Number(count),
      page,
      limit,
    );
  }

  /** Tenants missing any of the 4 required setup items (excludes RETIRED). */
  async countIncomplete(): Promise<number> {
    const [{ count }] = await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS count FROM (
        SELECT
          t.id,
          ${this.checklistSelectSql()}
        FROM "${DATABASE_SCHEMA}".tenants t
        WHERE t.status <> $1
      ) progress
      WHERE progress.completed_count < $2
      `,
      [TenantStatus.RETIRED, TenantConfigurationService.REQUIRED_STEPS],
    );
    return Number(count);
  }

  async create(tenantId: string, dto: CreateTenantConfigurationDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    if (await this.repo.findByTenantId(tenantId)) {
      throw new ConflictException(`Configuration already exists for tenant '${tenantId}'`);
    }
    await this.validateAssetRefs(tenantId, dto);
    return toConfigurationResponse(await this.repo.create({ ...dto, tenantId }));
  }

  async update(tenantId: string, dto: UpdateTenantConfigurationDto) {
    await this.get(tenantId);
    await this.validateAssetRefs(tenantId, dto);
    return toConfigurationResponse(await this.repo.update(tenantId, dto));
  }

  async delete(tenantId: string) {
    await this.repo.delete(tenantId);
  }

  private checklistSelectSql(): string {
    return `
      EXISTS (
        SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_identifiers i
        WHERE i.tenant_id = t.id
      ) AS has_identifier,
      EXISTS (
        SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_contacts c
        WHERE c.tenant_id = t.id
          AND c.is_active = TRUE
          AND (c.contact_type = '${ContactType.PRIMARY}' OR c.is_primary = TRUE)
      ) AS has_primary_contact,
      EXISTS (
        SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_smtp_configurations s
        WHERE s.tenant_id = t.id
      ) AS has_smtp,
      EXISTS (
        SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_addresses a
        WHERE a.tenant_id = t.id
          AND a.is_active = TRUE
      ) AS has_address,
      (
        (EXISTS (
          SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_identifiers i WHERE i.tenant_id = t.id
        ))::int
        + (EXISTS (
          SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_contacts c
          WHERE c.tenant_id = t.id
            AND c.is_active = TRUE
            AND (c.contact_type = '${ContactType.PRIMARY}' OR c.is_primary = TRUE)
        ))::int
        + (EXISTS (
          SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_smtp_configurations s WHERE s.tenant_id = t.id
        ))::int
        + (EXISTS (
          SELECT 1 FROM "${DATABASE_SCHEMA}".tenant_addresses a
          WHERE a.tenant_id = t.id AND a.is_active = TRUE
        ))::int
      ) AS completed_count
    `;
  }

  private progressStatusPredicate(
    status: TenantSetupProgressStatus,
    alias: string,
  ): string {
    const required = TenantConfigurationService.REQUIRED_STEPS;
    switch (status) {
      case TenantSetupProgressStatus.NOT_STARTED:
        return `${alias}.completed_count = 0`;
      case TenantSetupProgressStatus.IN_PROGRESS:
        return `${alias}.completed_count > 0 AND ${alias}.completed_count < ${required}`;
      case TenantSetupProgressStatus.COMPLETE:
        return `${alias}.completed_count = ${required}`;
      default:
        return 'TRUE';
    }
  }

  private mapListRow(row: Record<string, unknown>): TenantConfigurationResponseDto {
    const hasIdentifier = Boolean(row.has_identifier);
    const hasPrimaryContact = Boolean(row.has_primary_contact);
    const hasSmtp = Boolean(row.has_smtp);
    const hasAddress = Boolean(row.has_address);
    const completedCount = Number(row.completed_count ?? 0);
    const requiredCount = TenantConfigurationService.REQUIRED_STEPS;
    const percent = Math.round((completedCount / requiredCount) * 100);

    let progressStatus = TenantSetupProgressStatus.NOT_STARTED;
    if (completedCount >= requiredCount) progressStatus = TenantSetupProgressStatus.COMPLETE;
    else if (completedCount > 0) progressStatus = TenantSetupProgressStatus.IN_PROGRESS;

    const response: TenantConfigurationResponseDto = {
      tenantId: String(row.tenant_id),
      tenantCode: String(row.tenant_code),
      displayName: String(row.display_name),
      websiteUrl: row.website_url ? String(row.website_url) : undefined,
      tenantStatus: String(row.tenant_status),
      checklist: {
        identifier: hasIdentifier,
        primaryContact: hasPrimaryContact,
        smtp: hasSmtp,
        address: hasAddress,
      },
      completedCount,
      requiredCount,
      percent,
      progressStatus,
      missing: [
        !hasIdentifier ? 'identifier' : null,
        !hasPrimaryContact ? 'primaryContact' : null,
        !hasSmtp ? 'smtp' : null,
        !hasAddress ? 'address' : null,
      ].filter(Boolean) as Array<'identifier' | 'primaryContact' | 'smtp' | 'address'>,
      updatedAt: (row.configuration_updated_at ?? row.tenant_updated_at) as Date,
    };

    if (row.configuration_id) {
      response.id = String(row.configuration_id);
      response.timezone = row.timezone != null ? String(row.timezone) : undefined;
      response.locale = row.locale != null ? String(row.locale) : undefined;
      response.dateFormat = row.date_format != null ? String(row.date_format) : undefined;
      response.currencyCode = row.currency_code != null ? String(row.currency_code) : undefined;
      response.brandingName = row.branding_name != null ? String(row.branding_name) : undefined;
      response.logoAssetId = row.logo_asset_id != null ? String(row.logo_asset_id) : undefined;
      response.logoDarkAssetId =
        row.logo_dark_asset_id != null ? String(row.logo_dark_asset_id) : undefined;
      response.faviconAssetId =
        row.favicon_asset_id != null ? String(row.favicon_asset_id) : undefined;
      response.primaryColor = row.primary_color != null ? String(row.primary_color) : undefined;
      response.secondaryColor =
        row.secondary_color != null ? String(row.secondary_color) : undefined;
      response.accentColor = row.accent_color != null ? String(row.accent_color) : undefined;
      response.fontFamily = row.font_family != null ? String(row.font_family) : undefined;
      response.emailFromName =
        row.email_from_name != null ? String(row.email_from_name) : undefined;
      response.emailFromAddress =
        row.email_from_address != null ? String(row.email_from_address) : undefined;
      response.supportEmail = row.support_email != null ? String(row.support_email) : undefined;
      response.createdAt = row.configuration_created_at as Date;
    }

    return response;
  }

  private async validateAssetRefs(tenantId: string, dto: CreateTenantConfigurationDto) {
    const assetIds = [dto.logoAssetId, dto.logoDarkAssetId, dto.faviconAssetId].filter(Boolean);
    for (const assetId of assetIds) {
      const asset = await this.assetRepo.findById(tenantId, assetId!);
      if (!asset) {
        throw new NotFoundException(`Asset '${assetId}' not found for tenant '${tenantId}'`);
      }
    }
  }
}

@Injectable()
export class TenantSmtpService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_SMTP_REPOSITORY) private readonly repo: ITenantSmtpRepository,
  ) {}

  async get(tenantId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findByTenantId(tenantId);
    if (!row) throw new NotFoundException(`SMTP configuration for tenant '${tenantId}' not found`);
    return toSmtpResponse(row);
  }

  async listAll(page: number, limit: number, filters?: {
    tenantId?: string;
    host?: string;
    isActive?: boolean;
  }) {
    const { data, total } = await this.repo.findAll(page, limit, filters);
    return paginatedResponse(data.map(toSmtpResponse), total, page, limit);
  }

  async create(tenantId: string, dto: CreateTenantSmtpDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    if (await this.repo.findByTenantId(tenantId)) {
      throw new ConflictException(`SMTP configuration already exists for tenant '${tenantId}'`);
    }
    return toSmtpResponse(await this.repo.create({ ...dto, tenantId }));
  }

  async update(tenantId: string, dto: UpdateTenantSmtpDto) {
    await this.get(tenantId);
    return toSmtpResponse(await this.repo.update(tenantId, dto));
  }

  async delete(tenantId: string) {
    await this.repo.delete(tenantId);
  }
}

@Injectable()
export class TenantAssetService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
    @Inject(TENANT_ASSET_REPOSITORY) private readonly repo: ITenantAssetRepository,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorageService,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.repo.findByTenant(tenantId, page, limit);
    const resolved = await Promise.all(data.map((row) => this.toResolvedAssetResponse(row)));
    return paginatedResponse(resolved, total, page, limit);
  }

  async listAll(page: number, limit: number, filters?: {
    tenantId?: string;
    assetType?: string;
  }) {
    const { data, total } = await this.repo.findAll(page, limit, filters);
    const resolved = await Promise.all(data.map((row) => this.toResolvedAssetResponse(row)));
    return paginatedResponse(resolved, total, page, limit);
  }

  async get(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findById(tenantId, id);
    if (!row) throw new NotFoundException(`Asset '${id}' not found`);
    return this.toResolvedAssetResponse(row);
  }

  async create(tenantId: string, dto: CreateTenantAssetDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    return this.toResolvedAssetResponse(await this.repo.create({ ...dto, tenantId }));
  }

  async upload(tenantId: string, file: UploadedAssetFile, assetType: AssetType) {
    await this.tenantContext.ensureTenantExists(tenantId);
    assertValidAssetUpload(
      file,
      assetType,
      this.config.get<number>('storage.upload.maxImageBytes', 5_242_880),
      this.config.get<number>('storage.upload.maxDocumentBytes', 10_485_760),
    );

    const extension = extensionForMimeType(file.mimetype);
    const objectKey = `tenants/${tenantId}/${assetType.toLowerCase()}/${randomUUID()}.${extension}`;

    await this.storage.upload({
      key: objectKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const row = await this.repo.create({
      tenantId,
      assetType,
      fileUrl: objectKey,
      fileName: sanitizeOriginalName(file.originalname),
      contentType: file.mimetype,
    });

    return this.toResolvedAssetResponse(row);
  }

  async update(tenantId: string, id: string, dto: UpdateTenantAssetDto) {
    return this.toResolvedAssetResponse(await this.repo.update(tenantId, id, dto));
  }

  async delete(tenantId: string, id: string) {
    const row = await this.repo.findById(tenantId, id);
    if (!row) throw new NotFoundException(`Asset '${id}' not found`);

    const key = this.storage.extractKey(row.fileUrl);
    if (key) {
      await this.storage.delete(key);
    }

    await this.repo.delete(tenantId, id);
  }

  private async toResolvedAssetResponse(row: TenantAssetProps) {
    const response = toAssetResponse(row);
    response.fileUrl = await this.storage.resolveUrl(row.fileUrl);
    return response;
  }
}

@Injectable()
export class InstitutionProfileService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(INSTITUTION_PROFILE_REPOSITORY) private readonly repo: IInstitutionProfileRepository,
  ) {}

  async get(tenantId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findByTenantId(tenantId);
    if (!row) throw new NotFoundException(`Institution profile for tenant '${tenantId}' not found`);
    return toInstitutionProfileResponse(row);
  }

  async create(tenantId: string, dto: CreateInstitutionProfileDto) {
    await this.tenantContext.ensureTenantExists(tenantId);
    if (await this.repo.findByTenantId(tenantId)) {
      throw new ConflictException(`Institution profile already exists for tenant '${tenantId}'`);
    }
    return toInstitutionProfileResponse(await this.repo.create({ ...dto, tenantId }));
  }

  async update(tenantId: string, dto: UpdateInstitutionProfileDto) {
    await this.get(tenantId);
    return toInstitutionProfileResponse(await this.repo.update(tenantId, dto));
  }

  async delete(tenantId: string) {
    await this.repo.delete(tenantId);
  }
}
