import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return { status: 'ok', service: 'sift-api', timestamp: new Date().toISOString() };
  }
}
