import { Inject, Injectable } from '@nestjs/common';
import {
  DEPARTMENT_REPOSITORY,
  DESIGNATION_REPOSITORY,
  IDENTIFIER_TYPE_REPOSITORY,
  type ICatalogRepository,
} from '../domain/tenant.repository.interface.js';

@Injectable()
export class TenantCatalogService {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY) private readonly departments: ICatalogRepository,
    @Inject(DESIGNATION_REPOSITORY) private readonly designations: ICatalogRepository,
    @Inject(IDENTIFIER_TYPE_REPOSITORY) private readonly identifierTypes: ICatalogRepository,
  ) {}

  listDepartments() {
    return this.departments.findActive();
  }

  listDesignations() {
    return this.designations.findActive();
  }

  listIdentifierTypes() {
    return this.identifierTypes.findActive();
  }

  findIdentifierType(code: string) {
    return this.identifierTypes.findActiveByCode(code);
  }
}
