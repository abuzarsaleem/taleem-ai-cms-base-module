export interface TenantAccessContext {
    tenantId: string;
    roles: string[];
    permissions: string[];
}
export interface AuthenticatedUser {
    userId: string;
    email: string;
    tenantId?: string;
    roles: string[];
    permissions: string[];
    tenantAccess?: TenantAccessContext;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
