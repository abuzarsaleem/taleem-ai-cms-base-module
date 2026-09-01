import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module.js';
import {
  INSTITUTION_PROFILE_REPOSITORY,
  TENANT_ADDRESS_REPOSITORY,
  TENANT_ASSET_REPOSITORY,
  TENANT_BRANDING_REPOSITORY,
  TENANT_CONFIGURATION_REPOSITORY,
  TENANT_CONTACT_REPOSITORY,
  TENANT_IDENTIFIER_REPOSITORY,
  TENANT_REPOSITORY,
  TENANT_SMTP_REPOSITORY,
} from './domain/tenant.repository.interface.js';
import { TenantEntity } from './infrastructure/persistence/tenant.entity.js';
import {
  InstitutionProfileEntity,
  TenantAddressEntity,
  TenantAssetEntity,
  TenantBrandingEntity,
  TenantConfigurationEntity,
  TenantContactEntity,
  TenantIdentifierEntity,
  TenantSmtpConfigurationEntity,
} from './infrastructure/persistence/tenant-sub-resource.entities.js';
import { TypeOrmTenantRepository } from './infrastructure/persistence/typeorm-tenant.repository.js';
import {
  TypeOrmInstitutionProfileRepository,
  TypeOrmTenantAddressRepository,
  TypeOrmTenantAssetRepository,
  TypeOrmTenantBrandingRepository,
  TypeOrmTenantConfigurationRepository,
  TypeOrmTenantContactRepository,
  TypeOrmTenantIdentifierRepository,
  TypeOrmTenantSmtpRepository,
} from './infrastructure/persistence/typeorm-tenant-sub-resource.repositories.js';
import { TenantService } from './application/tenant.service.js';
import { TenantContextService } from './application/tenant-context.service.js';
import {
  InstitutionProfileService,
  TenantAddressService,
  TenantAssetService,
  TenantBrandingService,
  TenantConfigurationService,
  TenantContactService,
  TenantIdentifierService,
  TenantSmtpService,
} from './application/tenant-sub-resource.services.js';
import { TenantController } from './presentation/tenant.controller.js';
import {
  InstitutionProfileController,
  TenantAddressController,
  TenantAssetController,
  TenantBrandingController,
  TenantConfigurationController,
  TenantContactController,
  TenantIdentifierController,
  TenantSmtpController,
} from './presentation/tenant-sub-resource.controllers.js';

const entities = [
  TenantEntity,
  TenantContactEntity,
  TenantAddressEntity,
  TenantIdentifierEntity,
  TenantConfigurationEntity,
  TenantSmtpConfigurationEntity,
  TenantAssetEntity,
  InstitutionProfileEntity,
  TenantBrandingEntity,
];

const repositories = [
  { provide: TENANT_REPOSITORY, useClass: TypeOrmTenantRepository },
  { provide: TENANT_CONTACT_REPOSITORY, useClass: TypeOrmTenantContactRepository },
  { provide: TENANT_ADDRESS_REPOSITORY, useClass: TypeOrmTenantAddressRepository },
  { provide: TENANT_IDENTIFIER_REPOSITORY, useClass: TypeOrmTenantIdentifierRepository },
  { provide: TENANT_CONFIGURATION_REPOSITORY, useClass: TypeOrmTenantConfigurationRepository },
  { provide: TENANT_SMTP_REPOSITORY, useClass: TypeOrmTenantSmtpRepository },
  { provide: TENANT_ASSET_REPOSITORY, useClass: TypeOrmTenantAssetRepository },
  { provide: INSTITUTION_PROFILE_REPOSITORY, useClass: TypeOrmInstitutionProfileRepository },
  { provide: TENANT_BRANDING_REPOSITORY, useClass: TypeOrmTenantBrandingRepository },
];

@Module({
  imports: [TypeOrmModule.forFeature(entities), StorageModule],
  controllers: [
    TenantController,
    TenantContactController,
    TenantAddressController,
    TenantIdentifierController,
    TenantConfigurationController,
    TenantSmtpController,
    TenantAssetController,
    InstitutionProfileController,
    TenantBrandingController,
  ],
  providers: [
    TenantService,
    TenantContextService,
    TenantContactService,
    TenantAddressService,
    TenantIdentifierService,
    TenantConfigurationService,
    TenantSmtpService,
    TenantAssetService,
    InstitutionProfileService,
    TenantBrandingService,
    ...repositories,
  ],
  exports: [TenantService, TenantContextService, TENANT_REPOSITORY],
})
export class TenantModule {}
