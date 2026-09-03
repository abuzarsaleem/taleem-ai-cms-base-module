import { Inject, Injectable } from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import {
  AUDIT_EVENT_REPOSITORY,
  type IAuditEventRepository,
} from '../domain/subscription.repository.interface.js';
import type { AuditEventSearchFilters } from '../domain/subscription.types.js';

@Injectable()
export class AuditQueryService {
  constructor(
    @Inject(AUDIT_EVENT_REPOSITORY)
    private readonly auditEvents: IAuditEventRepository,
  ) {}

  search(filters: AuditEventSearchFilters, page: number, limit: number) {
    return this.auditEvents.search(filters, page, limit).then(({ data, total }) =>
      paginatedResponse(data, total, page, limit),
    );
  }
}
