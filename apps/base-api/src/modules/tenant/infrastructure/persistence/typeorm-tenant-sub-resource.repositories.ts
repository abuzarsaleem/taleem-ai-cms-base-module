import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IInstitutionProfileRepository,
  ITenantAddressRepository,
  ITenantAssetRepository,
  ITenantBrandingRepository,
  ITenantConfigurationRepository,
  ITenantContactRepository,
  ITenantIdentifierRepository,
  ITenantSmtpRepository,
  InstitutionProfileProps,
  TenantAddressProps,
  TenantAssetProps,
  TenantBrandingProps,
  TenantConfigurationProps,
  TenantContactProps,
  TenantIdentifierProps,
  TenantSmtpConfigurationProps,
} from '../../domain/tenant.repository.interface.js';
import {
  InstitutionProfileEntity,
  TenantAddressEntity,
  TenantAssetEntity,
  TenantBrandingEntity,
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
      mobilePhone: e.mobilePhone, landlinePhone: e.landlinePhone, isPrimary: e.isPrimary,
      isActive: e.isActive, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantAddressRepository implements ITenantAddressRepository {
  constructor(@InjectRepository(TenantAddressEntity) private readonly repo: Repository<TenantAddressEntity>) {}

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
      id: e.id, tenantId: e.tenantId, timezone: e.timezone, locale: e.locale,
      dateFormat: e.dateFormat, currencyCode: e.currencyCode, brandingName: e.brandingName,
      logoUrl: e.logoUrl, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantSmtpRepository implements ITenantSmtpRepository {
  constructor(@InjectRepository(TenantSmtpConfigurationEntity) private readonly repo: Repository<TenantSmtpConfigurationEntity>) {}

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

@Injectable()
export class TypeOrmTenantBrandingRepository implements ITenantBrandingRepository {
  constructor(@InjectRepository(TenantBrandingEntity) private readonly repo: Repository<TenantBrandingEntity>) {}

  async findByTenantId(tenantId: string) {
    const row = await this.repo.findOne({ where: { tenantId } });
    return row ? this.map(row) : null;
  }

  async create(props: TenantBrandingProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async update(tenantId: string, props: Partial<TenantBrandingProps>) {
    await this.repo.update({ tenantId }, props);
    return this.map(await this.repo.findOneOrFail({ where: { tenantId } }));
  }

  async delete(tenantId: string) {
    if (!(await this.repo.delete({ tenantId })).affected) notFound('Branding', tenantId);
  }

  private map(e: TenantBrandingEntity): TenantBrandingProps {
    return {
      id: e.id, tenantId: e.tenantId, logoAssetId: e.logoAssetId,
      logoDarkAssetId: e.logoDarkAssetId, faviconAssetId: e.faviconAssetId,
      primaryColor: e.primaryColor, secondaryColor: e.secondaryColor, accentColor: e.accentColor,
      fontFamily: e.fontFamily, emailFromName: e.emailFromName,
      emailFromAddress: e.emailFromAddress, supportEmail: e.supportEmail,
      createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}
