# Local-first goals (opt-in)

Default off. Set `VITE_LOCAL_FIRST_GOALS=true` at UI build time only after deploying the API input change and applying `AddGoalActionReceipts1790500000000`.

Only new goals (including their assist) are queued. Editing/deleting goals, clock changes, substitutions, and other mutations remain network-owned. A signed-in account and loaded game data are required. The goal modal closes after the IndexedDB transaction commits, not after a network response. Storage failure must leave the modal open.

## Design

- **Apollo is the only source of confirmed data.** The game page renders `GET_GAME_BY_ID` from the Apollo cache exactly as it does with the flag off; subscriptions and other mutations update that cache as usual.
- **IndexedDB holds only the outbox** — pending goals, one record per authenticated user and game (`goal-store.ts`). Every read-modify-write is one IndexedDB transaction, so tabs cannot lose each other's goals.
- **Pending goals are overlaid at render time** (`projectGoals`). The server stores a goal under its `clientActionId`, so once the confirmed copy is in the cache the pending copy is hidden by ID and never shows twice. Rejected goals are not overlaid (not counted in the score) and show Retry/Discard controls.
- **Delivery** (`GoalOutbox.sync`): send pending goals in recording order (a backed-off goal holds later ones), then refetch the game into the Apollo cache, then retire the delivered goals. A crash or failed refetch between those steps only causes a resend, which the server answers from its receipt without creating anything.
- **Triggers**: right after a goal is recorded, on mount, every 5 seconds while visible and online, and on wake/online/subscription-socket reconnect (`useResyncOnWake`).
- **Server**: goal, assist, and receipt commit in one transaction. Retries reuse the UUID and replay the receipt. Receipts survive event deletion, and replays are not published, so an old retry cannot resurrect an edited/deleted goal. Duplicate/conflict detection still runs for goals recorded on different devices.

Logout hides the previous user's pending goals without deleting unsynced work. Browser storage can still be cleared or evicted; this is not a backup or a promise of background execution while a phone is asleep. Reloading the app while offline is not supported: confirmed game data is not persisted and authentication needs the network.

## Verification

From the repository root:

```
NX_DAEMON=false pnpm nx test soccer-stats-ui --skip-nx-cache --testFiles=use-local-goals.spec.tsx,goal-outbox.spec.ts,goal-modal.local.spec.tsx,use-resync-on-wake.spec.ts
NX_DAEMON=false pnpm nx test soccer-stats-api --skip-nx-cache --runInBand --testPathPatterns=goal-idempotency
CI=1 NX_DAEMON=false pnpm nx test soccer-stats-ui --skip-nx-cache --testFiles=goal-store.browser.spec.ts
```

The browser tests run whenever `CI` is set (and fail if Chromium is missing) or when `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` points at a Chromium executable. Install the browser with `pnpm exec playwright install chromium`. They execute production IndexedDB + outbox code through reload, lost-ACK replay, and rejection retention. Transport responses are fixtures; this is not a full authenticated app E2E.

For real PostgreSQL verification, set `GOAL_TEST_DATABASE_URL` to a server where the user may `CREATE DATABASE` (the local dev container works). The suite creates a randomly named database, runs the complete migration chain, exercises the real GoalService, duplicate detection and advisory locks, then drops only that database. Without the variable those tests are skipped.

Before enabling for users, exercise a real authenticated browser/device session with the deployed GraphQL API: two clients, actual subscription delivery, expired auth, and visible Retry/Discard controls.
