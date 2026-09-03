export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface UserProps {
  id?: string;
  email: string;
  passwordHash?: string;
  emailVerified?: boolean;
  fullName: string;
  /** Stored object key or absolute URL; resolved to a public URL in API responses */
  avatarUrl?: string | null;
  status?: UserStatus;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserListFilters {
  email?: string;
  status?: UserStatus;
}
