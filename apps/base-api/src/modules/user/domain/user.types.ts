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
  status?: UserStatus;
}
