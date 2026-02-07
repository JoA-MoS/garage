# Subscribe-To-More Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the game page from independent `useSubscription` hooks to `subscribeToMore` on the main query, eliminating full-page re-renders caused by redundant refetches.

**Architecture:** The game page currently uses two independent `useSubscription` calls (`GameEventChanged`, `GameUpdated`) with callback-based cache updates. Stats-affecting events (substitutions, period changes) trigger full refetches of `GET_GAME_ROSTER` and `GET_GAME_BY_ID`, causing all child components to re-render. We'll migrate to `subscribeToMore` tied to the query lifecycle, debounce roster refetches, and tighten `useMemo` dependencies.

**Tech Stack:** React, Apollo Client (`subscribeToMore`, `cache.modify`), GraphQL subscriptions via WebSocket

---

## Problem Summary

The re-render cascade:

```
Substitution mutation completes
  → Backend publishes SUBSTITUTION_IN + SUBSTITUTION_OUT events
  → Independent useSubscription fires handleEventCreated for EACH event
  → handleEventCreated sees stats-affecting event → refetchQueries([GET_GAME_ROSTER, GET_GAME_BY_ID])
  → BOTH home AND away roster queries refetch (2 queries × 2 events = 4 refetches)
  → homeLineupData/awayLineupData object refs change
  → useMemo dependencies change → new onField/bench arrays
  → ALL child components re-render
```

## Architecture After Refactor

```
GET_GAME_BY_ID query
  ├── subscribeToMore(GAME_EVENT_CHANGED)
  │     └── updateQuery: delta-merge events into game.teams[].events
  │     └── side effect: debounced refetch of GET_GAME_ROSTER (affected team only)
  │
  └── subscribeToMore(GAME_UPDATED)
        └── updateQuery: merge status/timestamp fields into game

GET_GAME_ROSTER queries (home + away)
  └── Only refetched when stats-affecting events arrive (debounced, per-team)
```

---

### Task 1: Fix useMemo granularity for roster derivations

**Why:** The `useMemo` for `homeOnField`/`homeBench`/`awayOnField`/`awayBench` depends on the entire `homeLineupData`/`awayLineupData` query result object. Even when the underlying players array hasn't changed, a refetch creates a new result object, invalidating all memos. Depending on the `players` array directly prevents unnecessary recalculations.

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx:524-549`

**Step 1: Update useMemo dependencies**

Change the four roster derivation memos from depending on `homeLineupData`/`awayLineupData` to depending on the specific `players` array:

```typescript
// Before:
const homeOnField = useMemo(
  () => homeLineupData?.gameRoster?.players?.filter((p) => p.position != null) ?? [],
  [homeLineupData], // ← depends on entire query result
);

// After:
const homeRosterPlayers = homeLineupData?.gameRoster?.players;
const awayRosterPlayers = awayLineupData?.gameRoster?.players;

const homeOnField = useMemo(
  () => homeRosterPlayers?.filter((p) => p.position != null) ?? [],
  [homeRosterPlayers], // ← depends on players array only
);
const homeBench = useMemo(() => homeRosterPlayers?.filter((p) => p.position == null) ?? [], [homeRosterPlayers]);
const awayOnField = useMemo(() => awayRosterPlayers?.filter((p) => p.position != null) ?? [], [awayRosterPlayers]);
const awayBench = useMemo(() => awayRosterPlayers?.filter((p) => p.position == null) ?? [], [awayRosterPlayers]);
```

**Step 2: Verify the app still works**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache`
Expected: 0 errors

**Step 3: Commit**

```
feat(soccer-stats-ui): tighten useMemo deps for roster derivations
```

---

### Task 2: Debounce stats-affecting refetches and scope to affected team

**Why:** Currently, every stats-affecting subscription event (SUBSTITUTION_IN, SUBSTITUTION_OUT, etc.) triggers an immediate `refetchQueries` of ALL `GET_GAME_ROSTER` instances. A single substitution creates 2 events → 2 refetches of BOTH teams = 4 network requests. We debounce to collapse multiple events within 150ms into a single refetch, and scope it to only the affected team.

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx:599-697` (handleEventCreated)

**Step 1: Add a debounce ref and scoped refetch**

Near the top of the component (after existing refs), add:

```typescript
// Debounce roster refetches for stats-affecting events
// Accumulates affected gameTeamIds and refetches once after events settle
const rosterRefetchTimerRef = useRef<ReturnType<typeof setTimeout>>();
const pendingRosterRefetchIds = useRef<Set<string>>(new Set());
```

**Step 2: Replace the refetch in handleEventCreated**

In `handleEventCreated`, replace the stats-affecting block:

```typescript
// Before:
if (statsAffectingEvents.includes(event.eventType.name)) {
  apolloClient.refetchQueries({
    include: [GET_GAME_ROSTER, GET_GAME_BY_ID],
  });
}

// After:
if (statsAffectingEvents.includes(event.eventType.name)) {
  // Accumulate affected team and debounce refetch
  pendingRosterRefetchIds.current.add(event.gameTeamId);
  clearTimeout(rosterRefetchTimerRef.current);
  rosterRefetchTimerRef.current = setTimeout(() => {
    const teamIds = [...pendingRosterRefetchIds.current];
    pendingRosterRefetchIds.current.clear();
    // Only refetch rosters for teams that had events, not all instances
    teamIds.forEach((gameTeamId) => {
      apolloClient.query({
        query: GET_GAME_ROSTER,
        variables: { gameTeamId },
        fetchPolicy: 'network-only',
      });
    });
  }, 150);
}
```

**Key decisions:**

- 150ms debounce: Batch events arrive within milliseconds of each other. 150ms catches a full batch while keeping UI responsive.
- Removed `GET_GAME_BY_ID` from refetch: The game data (events) is already delta-merged by the cache.modify call above. Only roster positions need refetching.
- Per-team scoping: A home substitution doesn't invalidate away roster.

**Step 3: Clean up timer on unmount**

Add to the component's cleanup (or add a new useEffect):

```typescript
useEffect(() => {
  return () => {
    clearTimeout(rosterRefetchTimerRef.current);
  };
}, []);
```

**Step 4: Verify**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache`
Expected: 0 errors

Test manually: Make a substitution during active play. The field should update once (not flash/flicker).

**Step 5: Commit**

```
perf(soccer-stats-ui): debounce stats-affecting roster refetches
```

---

### Task 3: Migrate GameEventChanged to subscribeToMore

**Why:** The independent `useSubscription(GameEventChangedDocument)` in `useGameEventSubscription` hook has no lifecycle coupling to the main query. When the query unmounts or refetches, the subscription keeps running independently. `subscribeToMore` ties the subscription to the query, auto-unsubscribes when the query unmounts, and updates are applied directly to the query's cache entry.

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`
  - Add `subscribeToMore` for `GameEventChanged` on `GET_GAME_BY_ID`
  - Keep existing `cache.modify` logic (move into the subscription handler)
  - Keep highlight animation logic
- Modify: `apps/soccer-stats/ui/src/app/hooks/use-game-event-subscription.ts`
  - Remove `GameEventChanged` subscription (keep `GameUpdated` for now)

**Step 1: Extract subscribeToMore from GET_GAME_BY_ID query**

In `game.page.tsx`, update the query to destructure `subscribeToMore`:

```typescript
const { data, loading, error, subscribeToMore } = useQuery(GET_GAME_BY_ID, {
  variables: { id: gameId! },
  skip: !gameId,
  notifyOnNetworkStatusChange: false,
  fetchPolicy: 'cache-first',
});
```

**Step 2: Add subscribeToMore useEffect for GameEventChanged**

After the query and existing handlers, add:

```typescript
// Subscribe to real-time game events via subscribeToMore
// Tied to query lifecycle - auto-unsubscribes when query unmounts
useEffect(() => {
  if (!data?.game || !gameId) return;

  const unsubscribe = subscribeToMore({
    document: GameEventChangedDocument,
    variables: { gameId },
    updateQuery: (prev, { subscriptionData }) => {
      const payload = subscriptionData.data?.gameEventChanged;
      if (!payload) return prev;

      switch (payload.action) {
        case GameEventAction.Created:
          if (payload.event) {
            handleEventCreated(payload.event);
            // Add highlight
            setHighlightedEventIds((ids) => new Set(ids).add(payload.event!.id));
            setTimeout(() => {
              setHighlightedEventIds((ids) => {
                const newSet = new Set(ids);
                newSet.delete(payload.event!.id);
                return newSet;
              });
            }, 3000);
          }
          break;

        case GameEventAction.Updated:
          // Events updated in cache via normal Apollo normalization
          break;

        case GameEventAction.Deleted:
          if (payload.deletedEventId) {
            handleEventDeleted(payload.deletedEventId);
          }
          break;

        case GameEventAction.ConflictDetected:
          if (payload.conflict) {
            handleConflictDetected(payload.conflict);
          }
          break;

        default:
          break;
      }

      // Return prev unchanged - we handle cache updates manually via cache.modify
      // subscribeToMore's updateQuery return value would replace the entire query result,
      // but cache.modify gives us surgical precision
      return prev;
    },
  });

  return unsubscribe;
}, [data?.game, gameId, subscribeToMore, handleEventCreated, handleEventDeleted, handleConflictDetected]);
```

**Important:** We return `prev` from `updateQuery` because `handleEventCreated` already uses `cache.modify` for surgical updates. Using `updateQuery` to merge would require reconstructing the full `GET_GAME_BY_ID` response shape, which is fragile.

**Step 3: Move highlight state into game.page.tsx**

Add state for highlighted events (previously managed by `useGameEventSubscription`):

```typescript
const [highlightedEventIds, setHighlightedEventIds] = useState<Set<string>>(new Set());
const isEventHighlighted = useCallback((eventId: string) => highlightedEventIds.has(eventId), [highlightedEventIds]);
```

**Step 4: Remove GameEventChanged from useGameEventSubscription**

In `use-game-event-subscription.ts`:

- Remove `GameEventChangedDocument` subscription
- Remove all event callbacks (`onEventCreated`, `onEventUpdated`, `onEventDeleted`, `onDuplicateDetected`, `onConflictDetected`)
- Keep only `GameUpdatedDocument` subscription
- Simplify the hook interface

**Step 5: Update the game page's useGameEventSubscription call**

Remove the event callbacks from the hook call:

```typescript
// Before:
const { isConnected, isEventHighlighted } = useGameEventSubscription({
  gameId: gameId || '',
  onEventCreated: handleEventCreated,
  onEventDeleted: handleEventDeleted,
  onConflictDetected: handleConflictDetected,
  onGameStateChanged: handleGameStateChanged,
});

// After:
const { isConnected } = useGameEventSubscription({
  gameId: gameId || '',
  onGameStateChanged: handleGameStateChanged,
});
```

**Step 6: Add import for GameEventChangedDocument and GameEventAction**

```typescript
import {
  GameEventChangedDocument,
  GameEventAction,
  // ... existing imports
} from '@garage/soccer-stats/graphql-codegen';
```

**Step 7: Verify**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache`
Expected: 0 errors

Test: Open a game, make substitutions, record goals. Events should appear in real-time without page flicker.

**Step 8: Commit**

```
refactor(soccer-stats-ui): migrate GameEventChanged to subscribeToMore
```

---

### Task 4: Migrate GameUpdated to subscribeToMore

**Why:** Same lifecycle benefits as Task 3. The `GameUpdated` subscription handles game state changes (status, timestamps). Tying it to the query prevents orphaned subscriptions.

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`
- Modify or delete: `apps/soccer-stats/ui/src/app/hooks/use-game-event-subscription.ts`

**Step 1: Add subscribeToMore for GameUpdated**

```typescript
// Subscribe to game state changes (start, pause, halftime, end)
useEffect(() => {
  if (!data?.game || !gameId) return;

  const unsubscribe = subscribeToMore({
    document: GameUpdatedDocument,
    variables: { gameId },
    updateQuery: (prev, { subscriptionData }) => {
      const gameUpdate = subscriptionData.data?.gameUpdated;
      if (!gameUpdate || !prev.game) return prev;

      return {
        ...prev,
        game: {
          ...prev.game,
          status: gameUpdate.status,
          actualStart: (gameUpdate.actualStart as string) ?? prev.game.actualStart,
          firstHalfEnd: (gameUpdate.firstHalfEnd as string) ?? prev.game.firstHalfEnd,
          secondHalfStart: (gameUpdate.secondHalfStart as string) ?? prev.game.secondHalfStart,
          actualEnd: (gameUpdate.actualEnd as string) ?? prev.game.actualEnd,
          pausedAt: (gameUpdate.pausedAt as string) ?? prev.game.pausedAt,
        },
      };
    },
  });

  return unsubscribe;
}, [data?.game, gameId, subscribeToMore]);
```

**Step 2: Remove handleGameStateChanged and the cache.modify approach**

The `handleGameStateChanged` callback and its `apolloClient.cache.modify` call are no longer needed — `subscribeToMore`'s `updateQuery` handles it directly.

**Step 3: Remove or simplify useGameEventSubscription**

If both subscriptions are now migrated, the hook can be:

- **Deleted entirely** if no other consumers
- **Simplified** to only track connection status

Check for other consumers:

```bash
grep -r "useGameEventSubscription" apps/soccer-stats/ui/src/
```

If only used in game.page.tsx, delete the hook. Move connection tracking into the game page's subscribeToMore error handling.

**Step 4: Add import for GameUpdatedDocument**

```typescript
import {
  GameUpdatedDocument,
  // ... existing imports
} from '@garage/soccer-stats/graphql-codegen';
```

**Step 5: Verify**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache`
Expected: 0 errors

Test: Start a game, end first half, start second half. Status transitions should be instant without page refresh.

**Step 6: Commit**

```
refactor(soccer-stats-ui): migrate GameUpdated to subscribeToMore and remove subscription hook
```

---

### Task 5: Remove redundant useLineup calls from game page

**Why:** The game page currently calls `useLineup` twice (home + away) just to get `availableRoster`. But `useLineup` internally fetches `GET_GAME_ROSTER` with `cache-and-network` policy, creating ADDITIONAL roster queries that also get refetched. This doubles the number of roster queries.

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx:551-559`

**Step 1: Check if availableRoster is used outside LineupPanel**

Search for `homeAvailableRoster` and `awayAvailableRoster` usage. If they're only passed to `LineupPanel`, the `LineupPanel` smart component already calls `useLineup` internally and gets its own `availableRoster`.

If redundant, remove the two `useLineup` calls from the game page:

```typescript
// Remove these:
const { availableRoster: homeAvailableRoster } = useLineup({
  gameTeamId: homeTeamId || '',
  gameId: gameId,
});
const { availableRoster: awayAvailableRoster } = useLineup({
  gameTeamId: awayTeamId || '',
  gameId: gameId,
});
```

And update the `LineupPanel` component to not receive `availableRoster` as a prop (it already derives it internally).

**Step 2: Verify**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache`
Expected: 0 errors

**Step 3: Commit**

```
refactor(soccer-stats-ui): remove redundant useLineup calls from game page
```

---

## Testing Checklist

After all tasks, verify these scenarios work without flickering or full re-renders:

- [ ] Pre-game: Set lineup using lineup panel
- [ ] Start first half: Players appear on field
- [ ] Mid-game: Record a goal (no re-render of lineup components)
- [ ] Mid-game: Make a substitution via substitution panel
- [ ] End first half → halftime
- [ ] Halftime: Make a substitution (immediate, no queue)
- [ ] Start second half
- [ ] End game → stats tab
- [ ] Multi-client: Open game in two tabs, verify real-time sync

## Notes

- The `GET_GAME_ROSTER` query uses SQL window functions server-side to compute current positions from historical events. This is why roster data can't be computed client-side from subscription events alone — we must refetch, but we debounce.
- `subscribeToMore`'s `updateQuery` returning `prev` unchanged is intentional. We use `cache.modify` for event merging because it's more surgical than rebuilding the full query response shape.
- The `cache-and-network` fetch policy on `useLineup`'s roster query means it ALWAYS hits the network on mount. This is by design (game roster has no stable `id` for cache normalization) but means extra queries if useLineup is called multiple times.
