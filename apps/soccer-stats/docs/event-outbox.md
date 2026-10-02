# Soccer Stats — Live-Game Event Outbox

Design for making sideline actions (substitutions, position swaps, goals,
period and clock changes) update the screen instantly and survive flaky
signal. Written 2026-10-01 from the state of `main` at `6cc222b`.

## Problem

Every live-game action waits on the network before the screen changes:

- Confirming queued subs runs `batchLineupChanges` → removals → additions →
  two `network-only` refetches, and only then closes the panel
  (`substitution-panel.smart.tsx`). That's four or more round trips.
- `use-lineup.ts` mutations all use `awaitRefetchQueries: true`.
- No `optimisticResponse` exists. The UI updates when the server echoes the
  event back.
- On-field vs bench comes only from the server's `gameRoster` query
  (`position != null`). The client never derives a lineup from events, so it
  can't show a change before the server makes it.

Ordering is also fragile. Period and clock changes go through `updateGame`,
while lineup changes go through game-event mutations, so they can reach the
server out of order. `PeriodService.endPeriod` writes SUB_OUT rows for whoever
is on the field **when the server receives it**, plus GAME_ROSTER rows for the
next period. A substitution for that period that lands afterwards is accepted,
but those snapshot rows are then wrong.

## Facts this design relies on

- Events are rows with client-supplied `period` + `periodSecond`. The server
  adds only `createdAt`.
- IDs are DB-generated (`BaseEntity` `@PrimaryGeneratedColumn('uuid')`).
  Mutations reference earlier rows by server ID (`playerOutEventId`,
  `player1EventId`, `playerEventId`).
- No mutation takes an idempotency key, and there are no unique constraints
  beyond the PK.
- Multi-row mutations (sub = SUB_OUT + SUB_IN, swap = 2 rows, goal + assist,
  period end + children) save without a transaction.
- `GameTimingService` derives the clock from `createdAt` of PERIOD_START and
  STOPPAGE rows. STOPPAGE rows have no period and `periodSecond: 0`.
- `LineupService.getGameLineup` replays events ordered by
  `period, periodSecond, createdAt`. `getGameRoster` (what the UI uses) instead
  takes the latest row per player. These are two derivations that can disagree.

## Decisions

| Question                | Decision                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Devices per game        | Usually one phone. Cross-device ordering is deferred (phase 5).                       |
| Time for queued subs    | Confirm time. The sub happens when the ref lets players on.                           |
| Showing pending actions | An explicit hook merges confirmed + pending events. Apollo holds confirmed data only. |
| Idempotency             | `actionId` + a receipt table, applied in the same transaction as the event rows.      |
| Outbox scope            | All live-game actions, one ordered queue per game.                                    |

## Design

### 1. One ordered outbox per game

Every live action goes through `recordAction(gameId, action)`: subs, swaps,
removals and additions, goals, position and formation changes, period
start/end, and pause/resume. The action is written to IndexedDB, so it
survives the OS killing the app, and the call resolves. A single sender drains
the queue strictly in order, one action at a time. Period and clock changes
share the queue, so a sub can never overtake the period end that follows it.

On failure:

- Network errors and 5xx retry with backoff. Later actions wait behind the
  failed one.
- Validation and permission errors stop the queue and surface **Retry** /
  **Discard** on that action.

### 2. Client-chosen IDs and a server receipt

Each action carries:

- `actionId` (UUID), the idempotency key for the whole action.
- Client UUIDs for any rows a later action may reference, e.g. the SUB_IN
  row's ID so "sub that player back out" can name it before the server has
  seen it.

The server, in one transaction:

1. Looks up `applied_actions` by `actionId`. If found, return the recorded
   result without writing anything.
2. Validates, writes the event rows with the client IDs, and inserts the
   receipt.

The receipt is kept even if the events are later deleted. So a late retry
(e.g. the response was lost and the phone resends) can't re-create something
that was deleted afterwards.

### 3. Client-stamped time

Each action carries `period`/`periodSecond` (as now) and `occurredAt`, the
client wall clock at confirm. `GameTimingService` uses `occurredAt` instead of
`createdAt`, so a period start that syncs late doesn't shift the clock.
STOPPAGE rows get a real `period`/`periodSecond`. The server clamps
`occurredAt` so it can't be in the future or before the game was created.

### 4. Shared `deriveGameState(events)`

A pure function in `libs/soccer-stats/utils` replays events in
`(period, periodSecond, sequence)` order. It returns the on-field lineup with
positions, the bench, the score, and per-player play time. Parity tests
against `getGameLineup` keep the client and server in agreement, and the
server should move onto the same function over time.

The live screen renders through one hook:

```ts
const state = useLiveGameState(gameId);
// = deriveGameState([...confirmedEvents, ...pendingEventsFromOutbox])
```

Pending events are synthesized from outbox actions with their client IDs, and
marked `pending` so the UI can style them. When the confirmed copy (same ID)
arrives through the subscription or a refetch, it replaces the pending one.

This removes `gameRoster` and the post-mutation refetch chain from the live
path.

### 5. UX

The substitution panel keeps its queue-then-confirm flow. That's a real
sideline workflow: plan subs, confirm at a stoppage. Confirm enqueues and
closes immediately. Pending items show a subtle "syncing" state, and failed
items show Retry/Discard.

## Phases

1. **Server foundation (no UI change):**
   - `actionId` + client row IDs on live-game inputs
   - `applied_actions` table
   - transactions around multi-row writes
   - `occurredAt` on events, and timing derived from it
   - a period-scoped STOPPAGE
2. **Shared derivation:** `deriveGameState` + parity tests; switch the live
   screen to `useLiveGameState` (still sending mutations directly).
3. **Outbox:** IndexedDB queue + sender, `recordAction()` for every live
   action, pending overlay, Retry/Discard.
4. **Cache persistence:** persist the Apollo cache to IndexedDB for instant
   cold open. Switch `cache-first` queries to `cache-and-network`, and gate
   spinners on `loading && !data`.
5. **Cross-device (deferred):** stop materializing period-end snapshots at
   receipt, or validate late events against them.

## Phase 1 status (implemented)

Mutations that accept `actionId`, client event IDs and `occurredAt`:

| Mutation                                        | Client IDs                                                                     | Atomic                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `substitutePlayer`                              | `subOutEventId`, `subInEventId`                                                | yes                                               |
| `batchLineupChanges`                            | per sub `subOutEventId`/`subInEventId`, per swap `swap1EventId`/`swap2EventId` | yes, whole batch                                  |
| `swapPositions`                                 | `swap1EventId`, `swap2EventId`                                                 | yes                                               |
| `bringPlayerOntoField`, `removePlayerFromField` | `eventId`                                                                      | yes                                               |
| `recordPositionChange`, `recordFormationChange` | `eventId`                                                                      | yes (formation also updates `GameTeam.formation`) |
| `recordGoal`                                    | `goalEventId`, `assistEventId`                                                 | yes                                               |
| `updateGame` (status, pause/resume)             | none; also takes `period` for stoppages                                        | **no** — see below                                |

What the outbox client can rely on:

- **Retry semantics.** Resending an action with the same `actionId` returns
  the original result and writes nothing, even when two copies arrive
  concurrently. Reusing an `actionId` for a different game, user or
  mutation is a `BAD_REQUEST`.
- **Deleted since applied.** A retry whose recorded events were deleted
  afterwards returns a 409 (`ConflictException`) for single-event
  mutations. The client should treat it as "already applied".
- **Validation happens once.** Checks that depend on current state (field
  capacity, player lookups, goal duplicate detection) run only on the first
  application, so a retry can't fail because of its own earlier success.
- **New rows are inserted, never saved.** A client ID that already exists
  is rejected rather than overwriting the existing event.
- **Publishing.** Subscription events go out after commit and never on a
  replay.

Deviations from the plan:

- `updateGame` is guarded by the receipt but not a single transaction: a
  status change writes through several services. The receipt commits only
  if every write succeeded, so retries are safe, but a mid-way failure can
  still leave partial rows (as before). Making it atomic belongs with
  phase 5.
- The goal duplicate rule is unchanged (see Known issues). With one phone
  per game the receipt now covers retries, so the 60s rule only matters
  for genuine double-entry.
- `startPeriod`/`endPeriod`/`setSecondHalfLineup` are not converted. The
  live UI uses `updateGame` for period changes.

## Phase 2 status (implemented)

- `deriveGameRoster(events)` (`libs/soccer-stats/utils`) reproduces
  `LineupService.getGameRoster`: each player's latest roster event,
  position (null = bench), formation and halftime pre-fill. That includes
  Postgres `NULLS FIRST` ordering and input-order tie-breaking where
  `createdAt` differs only in microseconds.
  `apps/soccer-stats/api/scripts/roster-parity.ts` checks it against a real
  database: every existing game team plus 300 random histories (0
  mismatches). Re-run it after changing either side.
- `useTeamRoster(gameTeam)` (UI) derives the roster from `GetGameById`'s
  events. The game page and `use-lineup` use it instead of the `gameRoster`
  query.
- Lineup mutations return their events (`LineupEvent` fragment), and the
  response is written into `GameTeam.events`
  (`services/game-event-cache.ts`). The screen updates when the mutation
  responds, with no follow-up roster refetch. The substitution panel no
  longer awaits a refetch before closing.
- `GameTeam.events` only ever merges in. Delete mutations therefore prune
  cached events against the refetched game (`pruneDeletedGameEvents`), so
  a substitution's or swap's partner event, deleted without its own
  subscription message, disappears too.
- Prerequisite fixed in phase 1: `createdAt` now defaults to
  `clock_timestamp()`, so rows written in one transaction keep their write
  order.

Remaining waits until phase 3: one round trip per action (the mutation
itself), plus a background `GetGameById` refetch for server-computed play
time.

## Phase 3 status (implemented)

Code: `apps/soccer-stats/ui/src/app/outbox/`.

- **Queue** (`game-outbox.ts`, `outbox-storage.ts`): actions live in
  IndexedDB (via `idb-keyval`), one list per `userId:gameId`, so they
  survive the app being killed. They are sent strictly in order, one at a
  time.
- **Failures** (`classify-send-error.ts`):
  - Network errors, 5xx and expired sessions back off (1s doubling, max
    60s). After 6 attempts the action needs the user.
  - 400/403/404/validation errors mark the action failed. The queue stops
    there until the user picks Retry or Discard.
  - A 409 ("already applied") counts as done.
  - NestJS reports 404/409 as `INTERNAL_SERVER_ERROR` with
    `extensions.status`, so the status is read too.
- **Provider** (`game-outbox-context.tsx`): `GameOutboxProvider` wraps the
  game page. It sends on mount, after each action, on online/foreground,
  and every 5s while anything is queued. A confirmed action's returned
  events are written to the cache before it leaves the queue, so pending
  events turn into confirmed ones without a flicker.
- **Pending state:** `pending-events.ts` builds the events each action will
  create exactly as the API does (same client IDs).
  `game-patches.ts` / `game-clock-action.ts` give status/clock changes a
  local patch (status, pausedAt, and the clock sync fields) so the clock
  freezes or restarts at once. The page renders confirmed + pending
  events and the patched game.
- **Through the outbox:**
  - the substitution panel's Confirm (batch, removals, additions)
  - new goals (both modals and the quick goal)
  - start/end of halves, end game, pause and resume
- **Still direct:** editing or deleting events, reset, reopen, stats
  settings, and pre-game lineup setup.
- **UI:** `SyncStatus` shows "Syncing N change(s)" and failed actions with
  Retry/Discard. Events still syncing can't be edited or deleted from the
  timeline.
- **Schema check:** codegen writes the API schema to
  `graphql-codegen/src/generated/schema.introspection.json`.
  `outbox-variables.schema.spec.ts` validates every kind of action the app
  builds against it, so a misnamed input field fails a test instead of a
  coach's sync.

Not covered by automated tests: the game page's status/pause handlers and
the full device-to-API round trip. Verify those manually.

## Known issues found during design (not addressed here)

- The goal duplicate check (`DUPLICATE_CONFLICT_WINDOW_SECONDS`) silently
  drops a real second goal by the same scorer within 60s, and flags goals by
  different scorers within 60s as conflicts.
- `resolveEventConflict` clears `conflictId` with `undefined`, which may be a
  no-op.
- `String(parseInt(period) + 1)` and string-compared period ordering break for
  overtime periods (`OT1`).
- DTO `@Min`/`@Max` constraints aren't enforced (no `ValidationPipe` on the
  GraphQL API).
- `startPeriod`/`endPeriod` don't guard against duplicates or invalid game
  status. The `updateGame` path does.
