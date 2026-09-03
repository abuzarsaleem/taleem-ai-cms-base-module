export enum OAuthClientType {
  PUBLIC = 'PUBLIC',
  CONFIDENTIAL = 'CONFIDENTIAL',
}

export enum OAuthClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum RefreshFamilyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  BREACH_SUSPECTED = 'BREACH_SUSPECTED',
}

export enum OAuthGrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

export enum CodeChallengeMethod {
  S256 = 'S256',
}
