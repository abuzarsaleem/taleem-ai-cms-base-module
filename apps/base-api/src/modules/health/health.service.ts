import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'taleem-base-api',
      timestamp: new Date().toISOString(),
    };
  }
}
