import { Module } from '@nestjs/common';

import { CampsitesService } from './campsites.service';
import { CampsitesResolver } from './campsites.resolver';

@Module({
  providers: [CampsitesService, CampsitesResolver],
})
export class CampsitesModule {}
