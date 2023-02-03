import { Test, TestingModule } from '@nestjs/testing';

import { CampsitesResolver } from './campsites.resolver';

describe('CampsitesResolver', () => {
  let resolver: CampsitesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampsitesResolver],
    }).compile();

    resolver = module.get<CampsitesResolver>(CampsitesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
