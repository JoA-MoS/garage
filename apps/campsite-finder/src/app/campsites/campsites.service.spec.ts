import { Test, TestingModule } from '@nestjs/testing';

import { CampsitesService } from './campsites.service';

describe('CampsitesService', () => {
  let service: CampsitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampsitesService],
    }).compile();

    service = module.get<CampsitesService>(CampsitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
