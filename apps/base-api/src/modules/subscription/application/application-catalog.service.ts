import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { APPLICATION_REPOSITORY, type IApplicationRepository } from '../domain/subscription.repository.interface.js';
import { ApplicationStatus, AuditAction } from '../domain/subscription.types.js';
import { AuditService } from './audit.service.js';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/request/subscription.request.dto.js';
import { toApplicationResponse } from './mappers/subscription.mapper.js';

@Injectable()
export class ApplicationCatalogService {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: IApplicationRepository,
    private readonly audit: AuditService,
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
    return toApplicationResponse(created);
  }

  async findAll(page = 1, limit = 20) {
    const { data, total } = await this.applications.findAll(page, limit);
    return paginatedResponse(data.map(toApplicationResponse), total, page, limit);
  }

  async findById(id: string) {
    const application = await this.applications.findById(id);
    if (!application) throw new NotFoundException(`Application '${id}' not found`);
    return toApplicationResponse(application);
  }

  async update(id: string, dto: UpdateApplicationDto, actorUserId: string) {
    const before = await this.requireById(id);
    const updated = await this.applications.update(id, { ...dto, updatedBy: actorUserId });
    await this.audit.record({
      actorUserId,
      action: AuditAction.APPLICATION_UPDATED,
      entityType: 'application',
      entityId: id,
      oldValue: { name: before.name, version: before.version, launchUrl: before.launchUrl },
      newValue: { name: updated.name, version: updated.version, launchUrl: updated.launchUrl },
    });
    return toApplicationResponse(updated);
  }

  async deactivate(id: string, actorUserId: string) {
    const before = await this.requireById(id);
    if (before.status === ApplicationStatus.INACTIVE) {
      return toApplicationResponse(before);
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
    return toApplicationResponse(updated);
  }

  private async requireById(id: string) {
    const application = await this.applications.findById(id);
    if (!application) throw new NotFoundException(`Application '${id}' not found`);
    return application;
  }
}
