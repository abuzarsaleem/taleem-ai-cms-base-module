import { Injectable } from '@nestjs/common';
import { ApplicationCatalogService } from '../../subscription/application/application-catalog.service.js';
import type { RegisterApplicationDto } from '../../subscription/application/dto/request/subscription.request.dto.js';
import type { RegisterApplicationResponseDto } from '../../subscription/application/dto/response/subscription.response.dto.js';
import { ApplicationRoleService } from './application-role.service.js';

@Injectable()
export class ApplicationRegistrationService {
  constructor(
    private readonly catalog: ApplicationCatalogService,
    private readonly roles: ApplicationRoleService,
  ) {}

  async register(
    dto: RegisterApplicationDto,
    actorUserId: string,
  ): Promise<RegisterApplicationResponseDto> {
    const roleInputs = dto.roles ?? [];
    await this.roles.assertRoleCodesAvailable(roleInputs.map((r) => r.roleCode));

    const { roles: _roles, ...applicationDto } = dto;
    const application = await this.catalog.create(applicationDto, actorUserId);

    const roles = [];
    for (const role of roleInputs) {
      roles.push(
        await this.roles.create(application.id, {
          roleCode: role.roleCode,
          roleName: role.roleName,
          description: role.description,
        }),
      );
    }

    return { application, roles };
  }
}
