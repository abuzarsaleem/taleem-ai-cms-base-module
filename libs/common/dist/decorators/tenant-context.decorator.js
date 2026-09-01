import { createParamDecorator } from '@nestjs/common';
export const TenantContext = createParamDecorator((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
});
//# sourceMappingURL=tenant-context.decorator.js.map