import { Query, Resolver } from '@nestjs/graphql';

import { CampsitesService } from './campsites.service';
import { Campsite } from './models/campsite.model';

@Resolver((of) => Campsite)
export class CampsitesResolver {
  constructor(private readonly campsiteService: CampsitesService) {}

  @Query((returns) => [Campsite])
  campsites(): Promise<Campsite[]> {
    return this.campsiteService.findAll();
  }
}
