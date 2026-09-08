export enum IdentityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  INVITED = 'INVITED',
  DISABLED = 'DISABLED',
}

export enum IdentityType {
  PERSON = 'PERSON',
  SERVICE = 'SERVICE',
  SYSTEM = 'SYSTEM',
}

export enum IdentifierType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  USERNAME = 'USERNAME',
  EXTERNAL = 'EXTERNAL',
}

export enum IdentifierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CredentialType {
  PASSWORD = 'PASSWORD',
  TOTP = 'TOTP',
  WEBAUTHN = 'WEBAUTHN',
  API_KEY = 'API_KEY',
}

export enum CredentialStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
}

export enum AuthenticationMethodType {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}

export enum AuthenticationMethodStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
}

/**
 * Flattened view of an identity across `identities`, `identity_profiles`,
 * `identity_identifiers` (primary EMAIL) and `identity_credentials` (PASSWORD).
 */
export interface IdentityProps {
  id?: string;
  email: string;
  passwordHash?: string;
  emailVerified?: boolean;
  /** Maps to `identity_profiles.display_name` */
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  /** Stored object key or absolute URL; resolved to a public URL in API responses */
  avatarUrl?: string | null;
  status?: IdentityStatus;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IdentityListFilters {
  email?: string;
  status?: IdentityStatus;
}

export interface AuthenticationMethodProps {
  id?: string;
  identityId: string;
  methodType: AuthenticationMethodType | string;
  status?: AuthenticationMethodStatus | string;
  providerReference?: string | null;
  metadata?: Record<string, unknown> | null;
}
