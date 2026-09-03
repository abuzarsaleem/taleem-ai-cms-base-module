import { Inject, Injectable } from '@nestjs/common';
import { OAUTH_AUDIT_REPOSITORY, type IOAuthAuditRepository, type OAuthAuditEventProps } from '../domain/oauth.repository.interface.js';

@Injectable()
export class OauthAuditService {
  constructor(@Inject(OAUTH_AUDIT_REPOSITORY) private readonly repo: IOAuthAuditRepository) {}

  log(props: OAuthAuditEventProps) {
    return this.repo.create(props).catch(() => undefined);
  }
}
