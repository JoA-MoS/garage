# Local-first goals (opt-in)

Default off. Set `VITE_LOCAL_FIRST_GOALS=true` at UI build time only after deploying the API input change and applying `AddGoalActionReceipts1790500000000`. No Apollo cache persistence add-on is used.

Only new goals (including their assist) are queued. Editing/deleting goals, clock changes, substitutions, and other mutations remain network-owned. A previously confirmed game snapshot and signed-in account are required. The goal modal closes after the IndexedDB transaction commits, not after a network response. Storage failure must leave the modal open.

IndexedDB stores one atomic snapshot/outbox record per authenticated user and game. Retries reuse the UUID. Server goal, assist, and receipt are committed in one transaction. Receipts deliberately survive event deletion. Historical receipt replays are not published as CREATED because that could resurrect an edited/deleted goal in subscriber caches. Game-scoped catch-up recovers missed delivery.

Confirmed subscription snapshots retire matching local UUIDs atomically and preserve other pending goals. Rejections remain visible with Retry/Discard controls. Logout hides the previous user's stored data without deleting unsynced work. Browser storage can still be cleared or evicted; this is not a backup or a promise of background execution while a phone is asleep.

## Verification

From the repository root:

```
NX_DAEMON=false pnpm nx test soccer-stats-ui --skip-nx-cache --testFiles=use-local-goals.spec.tsx,goal-outbox.spec.ts,goal-modal.local.spec.tsx,use-resync-on-wake.spec.ts
NX_DAEMON=false pnpm nx test soccer-stats-api --skip-nx-cache --runInBand --testPathPatterns=goal-idempotency
NX_DAEMON=false pnpm nx test soccer-stats-ui --skip-nx-cache --testFiles=goal-store.browser.spec.ts
```

The browser tests require the project's Playwright Chromium headless shell (`pnpm exec playwright install chromium --only-shell`, set `PLAYWRIGHT_BROWSERS_PATH` to an installed copy, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing Chromium executable). They execute production IndexedDB + outbox code through reload, lost-ACK replay, remote/own echoes, rejection retention, transaction abort, and concurrent writers. Transport responses are fixtures; this is not a full authenticated app E2E.

For real PostgreSQL verification, set `GOAL_TEST_DATABASE_URL` to a **disposable local test server** and run the API command above. The integration suite creates a random database, runs the complete migration chain, exercises the real GoalService/TypeORM repositories and advisory locks, then drops only that database. The test user must have CREATE DATABASE permission. Without that variable, the four PostgreSQL tests are explicitly skipped. Tests verify eight concurrent retries produce one goal/assist/receipt, assist failure rolls back the transaction, lost acknowledgement replay, deletion safety, payload mismatch, and cross-user collision safety. Pub/sub delivery is mocked at the service boundary.

Before enabling for users, independently review the implementation and exercise a real authenticated browser/device session with the deployed GraphQL API: offline app-shell reload, two clients, actual subscription delivery, expired auth, and visible Retry/Discard controls. These headless tests do not establish mobile lifecycle, storage eviction, or end-to-end Clerk behavior.
