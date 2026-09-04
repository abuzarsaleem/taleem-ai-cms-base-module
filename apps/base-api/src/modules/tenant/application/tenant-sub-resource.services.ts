import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadedAssetFile } from './uploaded-asset-file.js';
import { paginatedResponse } from '@app/common';
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
import { AssetType } from '../domain/tenant.types.js';
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
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_CONFIGURATION_REPOSITORY) private readonly repo: ITenantConfigurationRepository,
    @Inject(TENANT_ASSET_REPOSITORY) private readonly assetRepo: ITenantAssetRepository,
  ) {}

  async get(tenantId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const row = await this.repo.findByTenantId(tenantId);
    if (!row) throw new NotFoundException(`Configuration for tenant '${tenantId}' not found`);
    return toConfigurationResponse(row);
  }

  async listAll(page: number, limit: number, filters?: {
    tenantId?: string;
    timezone?: string;
    locale?: string;
    currencyCode?: string;
  }) {
    const { data, total } = await this.repo.findAll(page, limit, filters);
    return paginatedResponse(data.map(toConfigurationResponse), total, page, limit);
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
