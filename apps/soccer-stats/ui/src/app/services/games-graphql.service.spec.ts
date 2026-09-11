import { print } from 'graphql';
import { describe, it, expect } from 'vitest';

import { UPDATE_GAME } from './games-graphql.service';

describe('UPDATE_GAME mutation', () => {
  it('requests the live-clock sync fields so the game clock updates atomically with status', () => {
    // Regression test: the game-start clock intermittently desynced from the
    // server because updateGame's response didn't include currentPeriod /
    // currentPeriodSecond / serverTimestamp. Apollo's cache only overwrites
    // fields present in a response, so `status` flipped to FirstHalf while
    // the clock-driving fields stayed at their stale pre-game values until a
    // separate `gameUpdated` WebSocket subscription happened to arrive.
    // See useSyncedGameTime, which is fed exactly these three fields.
    const printed = print(UPDATE_GAME);

    expect(printed).toMatch(/\bcurrentPeriod\b/);
    expect(printed).toMatch(/\bcurrentPeriodSecond\b/);
    expect(printed).toMatch(/\bserverTimestamp\b/);
  });
});
