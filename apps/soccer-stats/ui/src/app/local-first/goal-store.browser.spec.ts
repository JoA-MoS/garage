// @vitest-environment node
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';
import * as ts from 'typescript';
import { describe, it, expect } from 'vitest';

// Browser binaries are opt-in locally: ordinary unit-test runs must not
// download a browser. CI always runs this suite (Playwright's default install
// path), so a missing browser fails the job instead of silently skipping.
const describeWithChromium =
  process.env.CI || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? describe
    : describe.skip;

describeWithChromium('IndexedDB goal durability (real Chromium)', () => {
  it('runs offline goal entry, reload, lost ACK replay, echo merge and rejection recovery through the real outbox and IndexedDB', async () => {
    const compile = (name: string) =>
      ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      }).outputText;
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    });
    try {
      const page = await browser.newPage();
      await page.route('http://outbox.test/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<html></html>' }),
      );
      await page.goto('http://outbox.test');
      const install = async () => {
        await page.addScriptTag({
          content: `window.exports = {}; ${compile('./goal-store.ts')}; ${compile('./goal-outbox.ts')}; window.store = new exports.IndexedGoalStore();`,
        });
      };
      await install();
      const initial = await page.evaluate(async () => {
        const w = window as any;
        w.outbox = new w.exports.GoalOutbox(
          'user/game',
          w.store,
          () => {
            throw new Error('offline');
          },
          async () => undefined,
        );
        await w.outbox.hydrate({
          game: { id: 'game', teams: [{ id: 'team', events: [] }] },
        });
        await w.outbox.enqueue(
          {
            gameTeamId: 'team',
            period: '1',
            externalScorerName: 'Alex',
            externalAssisterName: 'Sam',
          },
          'action',
        );
        await w.outbox.sync(1000);
        return w.exports.projectGoals(await w.outbox.load()).game.teams[0]
          .events;
      });
      expect(initial).toHaveLength(1);
      expect(initial[0].childEvents[0].externalPlayerName).toBe('Sam');
      await page.reload();
      await install();
      const restored = await page.evaluate(async () => {
        const w = window as any;
        return w.exports.projectGoals(await w.store.read('user/game')).game
          .teams[0].events;
      });
      expect(restored).toEqual(initial);
      const replay = await page.evaluate(async () => {
        const w = window as any;
        // Transport fixture models a committed response lost in flight. Storage and
        // outbox are production code; server transaction semantics are tested on PG.
        const receipts = new Set<string>();
        let calls = 0;
        const snapshot = () => ({
          game: {
            id: 'game',
            teams: [
              { id: 'team', events: [...receipts].map((id) => ({ id })) },
            ],
          },
        });
        const outbox = new w.exports.GoalOutbox(
          'user/game',
          w.store,
          async (input: any) => {
            receipts.add(input.clientActionId);
            if (++calls === 1) throw new Error('lost ACK');
          },
          async () => snapshot(),
        );
        await outbox.sync(100000);
        const afterLostAck = (await outbox.load()).actions.length;
        await outbox.sync(200000);
        await outbox.enqueue({ gameTeamId: 'team', period: '1' }, 'pending');
        await outbox.confirm(
          {
            game: {
              id: 'game',
              teams: [
                { id: 'team', events: [{ id: 'action' }, { id: 'remote' }] },
              ],
            },
          },
          (await outbox.load()).revision ?? 0,
        );
        return {
          afterLostAck,
          calls,
          receipts: receipts.size,
          state: await outbox.load(),
          projected: w.exports.projectGoals(await outbox.load()),
        };
      });
      expect(replay.afterLostAck).toBe(1);
      expect(replay.calls).toBe(2);
      expect(replay.receipts).toBe(1);
      expect(replay.state.actions.map((a: any) => a.id)).toEqual(['pending']);
      expect(
        replay.projected.game.teams[0].events.map((e: any) => e.id),
      ).toEqual(['action', 'remote', 'pending']);
      const rejected = await page.evaluate(async () => {
        const w = window as any;
        const outbox = new w.exports.GoalOutbox(
          'user/game',
          w.store,
          async () => {
            throw {
              message: 'Permission revoked',
              errors: [{ extensions: { code: 'FORBIDDEN' } }],
            };
          },
          async () => undefined,
        );
        await outbox.sync(300000);
        const state = await outbox.load();
        return {
          state,
          events: w.exports.projectGoals(state).game.teams[0].events,
        };
      });
      expect(rejected.state.actions[0].status).toBe('needs-attention');
      expect(rejected.events).toHaveLength(2);
      await page.reload();
      await install();
      expect(
        await page.evaluate(
          async () =>
            (await (window as any).store.read('user/game')).actions[0].error,
        ),
      ).toBe('Permission revoked');
    } finally {
      await browser.close();
    }
  }, 30000);
  it('commits atomically, restores on reload, serializes concurrent writers, isolates accounts', async () => {
    const source = readFileSync(
      new URL('./goal-store.ts', import.meta.url),
      'utf8',
    );
    const js = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    });
    try {
      const page = await browser.newPage();
      await page.route('http://outbox.test/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<html></html>' }),
      );
      await page.goto('http://outbox.test');
      const install = () =>
        page.addScriptTag({
          content: `window.exports = {}; ${js}; window.store = new exports.IndexedGoalStore();`,
        });
      await install();
      const result = await page.evaluate(async () => {
        const store = (window as any).store;
        await Promise.all(
          ['a', 'b'].map((id) =>
            store.change('user/game', (s: any) => ({
              snapshot: { game: { id: 'game' } },
              actions: [...s.actions, { id }],
            })),
          ),
        );
        try {
          await store.change('user/game', () => {
            throw new Error('abort');
          });
        } catch {
          /* expected */
        }
        return {
          saved: await store.read('user/game'),
          other: await store.read('other/game'),
        };
      });
      expect(result.saved.actions).toHaveLength(2);
      expect(result.other).toBeUndefined();
      await page.reload();
      await install();
      expect(
        await page.evaluate(
          async () =>
            (await (window as any).store.read('user/game')).actions.length,
        ),
      ).toBe(2);
      await page.evaluate(async () =>
        (window as any).store.change('user/game', (s: any) => ({
          snapshot: { game: { id: 'confirmed' } },
          actions: s.actions.filter((a: any) => a.id !== 'a'),
        })),
      );
      await page.reload();
      await install();
      const acknowledged = await page.evaluate(async () =>
        (window as any).store.read('user/game'),
      );
      expect(acknowledged.snapshot.game.id).toBe('confirmed');
      expect(acknowledged.actions.map((a: any) => a.id)).toEqual(['b']);
    } finally {
      await browser.close();
    }
  }, 30000);
});
