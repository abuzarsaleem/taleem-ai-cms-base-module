import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_EVENT_REPOSITORY, type IAuditEventRepository } from '../domain/subscription.repository.interface.js';
import type { AuditAction } from '../domain/subscription.types.js';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_EVENT_REPOSITORY)
    private readonly auditEvents: IAuditEventRepository,
  ) {}

  record(input: {
    tenantId?: string;
    actorUserId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
  }) {
    return this.auditEvents.create({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
    });
  }
}
