import { validate } from 'class-validator';

import { RecordGoalInput } from './record-goal.input';

describe('goal input storage boundaries', () => {
  it.each([
    ['externalScorerName', 100],
    ['externalAssisterName', 100],
    ['externalScorerNumber', 10],
    ['externalAssisterNumber', 10],
    ['period', 20],
  ] as const)(
    'rejects overlength %s before database insertion',
    async (field, max) => {
      const value = Object.assign(new RecordGoalInput(), {
        gameTeamId: '11111111-1111-4111-8111-111111111111',
        period: '1',
        periodSecond: 0,
        [field]: 'x'.repeat(max + 1),
      });
      expect((await validate(value)).some((e) => e.property === field)).toBe(
        true,
      );
      value[field] = 'x'.repeat(max);
      expect(await validate(value)).toEqual([]);
    },
  );
});
