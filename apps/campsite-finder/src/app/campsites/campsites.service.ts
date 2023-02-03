import { Injectable } from '@nestjs/common';

import { Campsite } from './models/campsite.model';

@Injectable()
export class CampsitesService {
  async findAll(): Promise<Campsite[]> {
    return [];
  }
}
