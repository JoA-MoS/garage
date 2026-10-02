import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { WarmupController } from './warmup.controller';

describe('WarmupController', () => {
  async function createController(query: jest.Mock) {
    const moduleRef = await Test.createTestingModule({
      controllers: [WarmupController],
      providers: [{ provide: DataSource, useValue: { query } }],
    }).compile();
    return moduleRef.get(WarmupController);
  }

  it('runs a trivial query so a paused Aurora cluster resumes', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = await createController(query);

    const result = await controller.warmup();

    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(result.status).toBe('ok');
    expect(typeof result.durationMs).toBe('number');
  });

  it('propagates database failures so the client can retry', async () => {
    const query = jest.fn().mockRejectedValue(new Error('resuming'));
    const controller = await createController(query);

    await expect(controller.warmup()).rejects.toThrow('resuming');
  });
});
