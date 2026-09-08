import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { paginatedResponse } from '@app/common';
import {
  FILE_STORAGE,
  type IFileStorageService,
} from '../../storage/domain/storage.service.interface.js';
import {
  extensionForMimeType,
} from '../../tenant/application/asset-upload.validation.js';
import type { UploadedAssetFile } from '../../tenant/application/uploaded-asset-file.js';
import { APPLICATION_REPOSITORY, type IApplicationRepository } from '../domain/subscription.repository.interface.js';
import { ApplicationStatus, AuditAction, type ApplicationProps } from '../domain/subscription.types.js';
import { AuditService } from './audit.service.js';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/request/subscription.request.dto.js';
import type { ApplicationResponseDto } from './dto/response/subscription.response.dto.js';
import { toApplicationResponse } from './mappers/subscription.mapper.js';

const LOGO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

@Injectable()
export class ApplicationCatalogService {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: IApplicationRepository,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorageService,
  ) {}

  async create(dto: CreateApplicationDto, actorUserId: string) {
    const existing = await this.applications.findByCode(dto.applicationCode);
    if (existing) {
      throw new ConflictException(`Application code '${dto.applicationCode}' already exists`);
    }
    const created = await this.applications.create({
      ...dto,
      status: ApplicationStatus.ACTIVE,
      createdBy: actorUserId,
    });
    await this.audit.record({
      actorUserId,
      action: AuditAction.APPLICATION_CREATED,
      entityType: 'application',
      entityId: created.id,
      newValue: { applicationCode: created.applicationCode, status: created.status },
    });
    return this.toResolvedResponse(created);
  }

  async findAll(page = 1, limit = 20) {
    const { data, total } = await this.applications.findAll(page, limit);
    const resolved = await Promise.all(data.map((row) => this.toResolvedResponse(row)));
    return paginatedResponse(resolved, total, page, limit);
  }

  async findById(id: string) {
    return this.toResolvedResponse(await this.requireById(id));
  }

  async update(id: string, dto: UpdateApplicationDto, actorUserId: string) {
    const before = await this.requireById(id);

    if (dto.logoUrl !== undefined && before.logoUrl && before.logoUrl !== dto.logoUrl) {
      await this.deleteStoredLogo(before.logoUrl);
    }

    const updated = await this.applications.update(id, { ...dto, updatedBy: actorUserId });
    await this.audit.record({
      actorUserId,
      action: AuditAction.APPLICATION_UPDATED,
      entityType: 'application',
      entityId: id,
      oldValue: {
        name: before.name,
        version: before.version,
        launchUrl: before.launchUrl,
        logoUrl: before.logoUrl,
      },
      newValue: {
        name: updated.name,
        version: updated.version,
        launchUrl: updated.launchUrl,
        logoUrl: updated.logoUrl,
      },
    });
    return this.toResolvedResponse(updated);
  }

  async deactivate(id: string, actorUserId: string) {
    const before = await this.requireById(id);
    if (before.status === ApplicationStatus.INACTIVE) {
      return this.toResolvedResponse(before);
    }
    const updated = await this.applications.update(id, {
      status: ApplicationStatus.INACTIVE,
      updatedBy: actorUserId,
    });
    await this.audit.record({
      actorUserId,
      action: AuditAction.APPLICATION_DEACTIVATED,
      entityType: 'application',
      entityId: id,
      oldValue: { status: before.status },
      newValue: { status: updated.status },
    });
    return this.toResolvedResponse(updated);
  }

  async uploadLogo(id: string, file: UploadedAssetFile | undefined, actorUserId: string) {
    const application = await this.requireById(id);
    this.assertValidLogoUpload(file);

    const extension = extensionForMimeType(file!.mimetype);
    const objectKey = `applications/${id}/logo/${randomUUID()}.${extension}`;

    await this.storage.upload({
      key: objectKey,
      body: file!.buffer,
      contentType: file!.mimetype,
    });

    if (application.logoUrl) {
      await this.deleteStoredLogo(application.logoUrl);
    }

    const updated = await this.applications.update(id, {
      logoUrl: objectKey,
      updatedBy: actorUserId,
    });

    await this.audit.record({
      actorUserId,
      action: AuditAction.APPLICATION_UPDATED,
      entityType: 'application',
      entityId: id,
      oldValue: { logoUrl: application.logoUrl },
      newValue: { logoUrl: objectKey },
    });

    return this.toResolvedResponse(updated);
  }

  async removeLogo(id: string, actorUserId: string) {
    const application = await this.requireById(id);
    if (!application.logoUrl) {
      return this.toResolvedResponse(application);
    }

    await this.deleteStoredLogo(application.logoUrl);
    const updated = await this.applications.update(id, {
      logoUrl: null,
      updatedBy: actorUserId,
    });

    await this.audit.record({
      actorUserId,
      action: AuditAction.APPLICATION_UPDATED,
      entityType: 'application',
      entityId: id,
      oldValue: { logoUrl: application.logoUrl },
      newValue: { logoUrl: null },
    });

    return this.toResolvedResponse(updated);
  }

  private async requireById(id: string) {
    const application = await this.applications.findById(id);
    if (!application) throw new NotFoundException(`Application '${id}' not found`);
    return application;
  }

  private async toResolvedResponse(props: ApplicationProps): Promise<ApplicationResponseDto> {
    const response = toApplicationResponse(props);
    if (props.logoUrl) {
      response.logoUrl = await this.storage.resolveUrl(props.logoUrl);
    }
    return response;
  }

  private assertValidLogoUpload(file: UploadedAssetFile | undefined): asserts file is UploadedAssetFile {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (!LOGO_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, GIF, and SVG images are allowed');
    }
    const maxBytes = this.config.get<number>('storage.upload.maxImageBytes', 5_242_880);
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))}MB`,
      );
    }
  }

  private async deleteStoredLogo(storedValue: string): Promise<void> {
    const key = this.storage.extractKey(storedValue);
    if (key) {
      await this.storage.delete(key).catch(() => undefined);
    }
  }
}
