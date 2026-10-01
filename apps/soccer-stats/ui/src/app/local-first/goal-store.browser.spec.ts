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
  it('runs offline goal entry, reload, lost ACK replay and rejection recovery through the real outbox and IndexedDB', async () => {
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
          content: `window.exports = {}; ${compile('./goal-store.ts')}; ${compile('./goal-outbox.ts')}; window.store = new exports.IndexedGoalStore(); window.confirmed = (ids) => ({ game: { id: 'game', teams: [{ id: 'team', events: ids.map((id) => ({ id })) }] } });`,
        });
      };
      await install();
      const offline = await page.evaluate(async () => {
        const w = window as any;
        const outbox = new w.exports.GoalOutbox(
          'user/game',
          w.store,
          async () => {
            throw new Error('offline');
          },
          async () => undefined,
        );
        await outbox.enqueue(
          {
            gameTeamId: 'team',
            period: '1',
            externalScorerName: 'Alex',
            externalAssisterName: 'Sam',
          },
          'action',
        );
        await outbox.sync(1000);
        const { actions } = await outbox.load();
        return {
          actions,
          events: w.exports.projectGoals(w.confirmed([]), actions).game.teams[0]
            .events,
        };
      });
      expect(offline.actions[0]).toMatchObject({
        id: 'action',
        attempts: 1,
        status: 'saved-device',
      });
      expect(offline.events[0].childEvents[0].externalPlayerName).toBe('Sam');
      await page.reload();
      await install();
      const restored = await page.evaluate(async () => {
        const w = window as any;
        const { actions } = await w.store.read('user/game');
        return w.exports.projectGoals(w.confirmed([]), actions).game.teams[0]
          .events;
      });
      expect(restored).toEqual(offline.events);
      const replay = await page.evaluate(async () => {
        const w = window as any;
        // Transport fixture models a committed response lost in flight. Storage
        // and outbox are production code; server receipts are tested on PG.
        const receipts = new Set<string>();
        let sends = 0;
        let confirms = 0;
        const outbox = new w.exports.GoalOutbox(
          'user/game',
          w.store,
          async (input: any) => {
            receipts.add(input.clientActionId);
            if (++sends === 1) throw new Error('lost ACK');
          },
          async () => {
            confirms++;
          },
        );
        await outbox.sync(100000);
        const afterLostAck = (await outbox.load()).actions.length;
        await outbox.sync(200000);
        return {
          afterLostAck,
          sends,
          confirms,
          receipts: receipts.size,
          state: await outbox.load(),
        };
      });
      expect(replay).toEqual({
        afterLostAck: 1,
        sends: 2,
        confirms: 1,
        receipts: 1,
        state: { actions: [] },
      });
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
        await outbox.enqueue({ gameTeamId: 'team', period: '1' }, 'denied');
        await outbox.sync(300000);
        const { actions } = await outbox.load();
        return {
          actions,
          events: w.exports.projectGoals(w.confirmed(['remote']), actions).game
            .teams[0].events,
        };
      });
      expect(rejected.actions[0].status).toBe('needs-attention');
      expect(rejected.events.map((e: any) => e.id)).toEqual(['remote']);
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
          actions: s.actions.filter((a: any) => a.id !== 'a'),
        })),
      );
      await page.reload();
      await install();
      const acknowledged = await page.evaluate(async () =>
        (window as any).store.read('user/game'),
      );
      expect(acknowledged.actions.map((a: any) => a.id)).toEqual(['b']);
    } finally {
      await browser.close();
    }
  }, 30000);
});
