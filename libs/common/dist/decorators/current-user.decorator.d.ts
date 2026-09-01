export interface AuthenticatedUser {
    userId: string;
    email: string;
    tenantId?: string;
    roles: string[];
    permissions: string[];
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
