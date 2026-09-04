import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IInstitutionProfileRepository,
  ITenantAddressRepository,
  ITenantAssetRepository,
  ITenantConfigurationRepository,
  ITenantContactRepository,
  ITenantIdentifierRepository,
  ITenantSmtpRepository,
  InstitutionProfileProps,
  TenantAddressProps,
  TenantAssetProps,
  TenantConfigurationProps,
  TenantContactProps,
  TenantIdentifierProps,
  TenantSmtpConfigurationProps,
} from '../../domain/tenant.repository.interface.js';
import {
  InstitutionProfileEntity,
  TenantAddressEntity,
  TenantAssetEntity,
  TenantConfigurationEntity,
  TenantContactEntity,
  TenantIdentifierEntity,
  TenantSmtpConfigurationEntity,
} from './tenant-sub-resource.entities.js';

function notFound(resource: string, id: string): never {
  throw new NotFoundException(`${resource} '${id}' not found`);
}

@Injectable()
export class TypeOrmTenantContactRepository implements ITenantContactRepository {
  constructor(@InjectRepository(TenantContactEntity) private readonly repo: Repository<TenantContactEntity>) {}

  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      contactType?: string;
      email?: string;
      search?: string;
      isActive?: boolean;
      isPrimary?: boolean;
    },
  ) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.created_at', 'DESC');
    if (filters?.tenantId) qb.andWhere('c.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.contactType) qb.andWhere('c.contact_type = :contactType', { contactType: filters.contactType });
    if (filters?.email) {
      qb.andWhere('LOWER(c.email) LIKE :email', { email: `%${filters.email.toLowerCase()}%` });
    }
    if (filters?.search) {
      qb.andWhere(
        `(LOWER(c.first_name) LIKE :search OR LOWER(COALESCE(c.middle_name, '')) LIKE :search OR LOWER(c.last_name) LIKE :search)`,
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
    if (filters?.isActive !== undefined) qb.andWhere('c.is_active = :isActive', { isActive: filters.isActive });
    if (filters?.isPrimary !== undefined) qb.andWhere('c.is_primary = :isPrimary', { isPrimary: filters.isPrimary });

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  findByTenant(tenantId: string, page: number, limit: number) {
    return this.repo.findAndCount({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    }).then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantContactProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, id: string, props: Partial<TenantContactProps>) {
    const existing = await this.findById(tenantId, id);
    if (!existing) notFound('Contact', id);
    await this.repo.update({ id, tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  async delete(tenantId: string, id: string) {
    const result = await this.repo.delete({ id, tenantId });
    if (!result.affected) notFound('Contact', id);
  }

  private map(e: TenantContactEntity): TenantContactProps {
    return {
      id: e.id, tenantId: e.tenantId, contactType: e.contactType, firstName: e.firstName,
      middleName: e.middleName, lastName: e.lastName, designation: e.designation,
      department: e.department, responsibility: e.responsibility, email: e.email,
      mobilePhone: e.mobilePhone, landlinePhone: e.landlinePhone, whatsappNumber: e.whatsappNumber,
      isPrimary: e.isPrimary, isActive: e.isActive, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantAddressRepository implements ITenantAddressRepository {
  constructor(@InjectRepository(TenantAddressEntity) private readonly repo: Repository<TenantAddressEntity>) {}

  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      addressType?: string;
      city?: string;
      countryCode?: string;
      isActive?: boolean;
    },
  ) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
    if (filters?.tenantId) qb.andWhere('a.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.addressType) qb.andWhere('a.address_type = :addressType', { addressType: filters.addressType });
    if (filters?.city) {
      qb.andWhere('LOWER(a.city) LIKE :city', { city: `%${filters.city.toLowerCase()}%` });
    }
    if (filters?.countryCode) {
      qb.andWhere('UPPER(a.country_code) = :countryCode', { countryCode: filters.countryCode.toUpperCase() });
    }
    if (filters?.isActive !== undefined) qb.andWhere('a.is_active = :isActive', { isActive: filters.isActive });

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  findByTenant(tenantId: string, page: number, limit: number) {
    return this.repo.findAndCount({
      where: { tenantId }, skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' },
    }).then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantAddressProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, id: string, props: Partial<TenantAddressProps>) {
    if (!(await this.findById(tenantId, id))) notFound('Address', id);
    await this.repo.update({ id, tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  async delete(tenantId: string, id: string) {
    if (!(await this.repo.delete({ id, tenantId })).affected) notFound('Address', id);
  }

  private map(e: TenantAddressEntity): TenantAddressProps {
    return {
      id: e.id, tenantId: e.tenantId, addressType: e.addressType, addressLine1: e.addressLine1,
      addressLine2: e.addressLine2, area: e.area, city: e.city, district: e.district,
      provinceCode: e.provinceCode, postalCode: e.postalCode, countryCode: e.countryCode,
      isPrimary: e.isPrimary, isActive: e.isActive, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantIdentifierRepository implements ITenantIdentifierRepository {
  constructor(@InjectRepository(TenantIdentifierEntity) private readonly repo: Repository<TenantIdentifierEntity>) {}

  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      identifierType?: string;
      identifierValue?: string;
      isVerified?: boolean;
    },
  ) {
    const qb = this.repo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (filters?.tenantId) qb.andWhere('i.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.identifierType) {
      qb.andWhere('UPPER(i.identifier_type) = :identifierType', {
        identifierType: filters.identifierType.toUpperCase(),
      });
    }
    if (filters?.identifierValue) {
      qb.andWhere('LOWER(i.identifier_value) LIKE :identifierValue', {
        identifierValue: `%${filters.identifierValue.toLowerCase()}%`,
      });
    }
    if (filters?.isVerified !== undefined) {
      qb.andWhere('i.is_verified = :isVerified', { isVerified: filters.isVerified });
    }

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  findByTenant(tenantId: string, page: number, limit: number) {
    return this.repo.findAndCount({
      where: { tenantId }, skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' },
    }).then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantIdentifierProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, id: string, props: Partial<TenantIdentifierProps>) {
    if (!(await this.findById(tenantId, id))) notFound('Identifier', id);
    await this.repo.update({ id, tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  async delete(tenantId: string, id: string) {
    if (!(await this.repo.delete({ id, tenantId })).affected) notFound('Identifier', id);
  }

  private map(e: TenantIdentifierEntity): TenantIdentifierProps {
    return {
      id: e.id, tenantId: e.tenantId, identifierType: e.identifierType,
      identifierValue: e.identifierValue, issuingAuthority: e.issuingAuthority,
      issueDate: e.issueDate, expiryDate: e.expiryDate, isVerified: e.isVerified,
      verifiedAt: e.verifiedAt, verifiedBy: e.verifiedBy, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantConfigurationRepository implements ITenantConfigurationRepository {
  constructor(@InjectRepository(TenantConfigurationEntity) private readonly repo: Repository<TenantConfigurationEntity>) {}

  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      timezone?: string;
      locale?: string;
      currencyCode?: string;
    },
  ) {
    const qb = this.repo.createQueryBuilder('cfg').orderBy('cfg.created_at', 'DESC');
    if (filters?.tenantId) qb.andWhere('cfg.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.timezone) qb.andWhere('cfg.timezone = :timezone', { timezone: filters.timezone });
    if (filters?.locale) qb.andWhere('cfg.locale = :locale', { locale: filters.locale });
    if (filters?.currencyCode) {
      qb.andWhere('UPPER(cfg.currency_code) = :currencyCode', {
        currencyCode: filters.currencyCode.toUpperCase(),
      });
    }

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findByTenantId(tenantId: string) {
    const row = await this.repo.findOne({ where: { tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantConfigurationProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, props: Partial<TenantConfigurationProps>) {
    await this.repo.update({ tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { tenantId } }));
  }

  async delete(tenantId: string) {
    if (!(await this.repo.delete({ tenantId })).affected) notFound('Configuration', tenantId);
  }

  private map(e: TenantConfigurationEntity): TenantConfigurationProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      timezone: e.timezone,
      locale: e.locale,
      dateFormat: e.dateFormat,
      currencyCode: e.currencyCode,
      brandingName: e.brandingName,
      logoUrl: e.logoUrl,
      logoAssetId: e.logoAssetId,
      logoDarkAssetId: e.logoDarkAssetId,
      faviconAssetId: e.faviconAssetId,
      primaryColor: e.primaryColor,
      secondaryColor: e.secondaryColor,
      accentColor: e.accentColor,
      fontFamily: e.fontFamily,
      emailFromName: e.emailFromName,
      emailFromAddress: e.emailFromAddress,
      supportEmail: e.supportEmail,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantSmtpRepository implements ITenantSmtpRepository {
  constructor(@InjectRepository(TenantSmtpConfigurationEntity) private readonly repo: Repository<TenantSmtpConfigurationEntity>) {}

  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      host?: string;
      isActive?: boolean;
    },
  ) {
    const qb = this.repo.createQueryBuilder('s').orderBy('s.created_at', 'DESC');
    if (filters?.tenantId) qb.andWhere('s.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.host) {
      qb.andWhere('LOWER(s.host) LIKE :host', { host: `%${filters.host.toLowerCase()}%` });
    }
    if (filters?.isActive !== undefined) qb.andWhere('s.is_active = :isActive', { isActive: filters.isActive });

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findByTenantId(tenantId: string) {
    const row = await this.repo.findOne({ where: { tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantSmtpConfigurationProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, props: Partial<TenantSmtpConfigurationProps>) {
    await this.repo.update({ tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { tenantId } }));
  }

  async delete(tenantId: string) {
    if (!(await this.repo.delete({ tenantId })).affected) notFound('SMTP configuration', tenantId);
  }

  private map(e: TenantSmtpConfigurationEntity): TenantSmtpConfigurationProps {
    return {
      id: e.id, tenantId: e.tenantId, host: e.host, port: e.port, username: e.username,
      passwordSecretRef: e.passwordSecretRef, encryption: e.encryption, fromName: e.fromName,
      fromEmail: e.fromEmail, replyToEmail: e.replyToEmail, isActive: e.isActive,
      createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantAssetRepository implements ITenantAssetRepository {
  constructor(@InjectRepository(TenantAssetEntity) private readonly repo: Repository<TenantAssetEntity>) {}

  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      assetType?: string;
    },
  ) {
    const qb = this.repo.createQueryBuilder('asset').orderBy('asset.created_at', 'DESC');
    if (filters?.tenantId) qb.andWhere('asset.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.assetType) qb.andWhere('asset.asset_type = :assetType', { assetType: filters.assetType });

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  findByTenant(tenantId: string, page: number, limit: number) {
    return this.repo.findAndCount({
      where: { tenantId }, skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' },
    }).then(([rows, total]) => ({ data: rows.map((row) => this.map(row)), total }));
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantAssetProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, id: string, props: Partial<TenantAssetProps>) {
    if (!(await this.findById(tenantId, id))) notFound('Asset', id);
    await this.repo.update({ id, tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  async delete(tenantId: string, id: string) {
    if (!(await this.repo.delete({ id, tenantId })).affected) notFound('Asset', id);
  }

  private map(e: TenantAssetEntity): TenantAssetProps {
    return {
      id: e.id, tenantId: e.tenantId, assetType: e.assetType, fileUrl: e.fileUrl,
      fileName: e.fileName, contentType: e.contentType, createdAt: e.createdAt,
    };
  }
}

@Injectable()
export class TypeOrmInstitutionProfileRepository implements IInstitutionProfileRepository {
  constructor(@InjectRepository(InstitutionProfileEntity) private readonly repo: Repository<InstitutionProfileEntity>) {}

  async findByTenantId(tenantId: string) {
    const row = await this.repo.findOne({ where: { tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: InstitutionProfileProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, props: Partial<InstitutionProfileProps>) {
    await this.repo.update({ tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { tenantId } }));
  }

  async delete(tenantId: string) {
    if (!(await this.repo.delete({ tenantId })).affected) notFound('Institution profile', tenantId);
  }

  private map(e: InstitutionProfileEntity): InstitutionProfileProps {
    return {
      id: e.id, tenantId: e.tenantId, legalName: e.legalName, displayName: e.displayName,
      registrationNumber: e.registrationNumber, campusType: e.campusType,
      institutionType: e.institutionType, website: e.website, addressLine1: e.addressLine1,
      addressLine2: e.addressLine2, city: e.city, stateProvince: e.stateProvince,
      postalCode: e.postalCode, countryCode: e.countryCode, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}
