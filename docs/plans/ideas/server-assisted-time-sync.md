# Server-Assisted Game Time Sync

**Status:** Idea (not started)
**Date:** 2026-02-02

## Problem

Currently game time (period + periodSecond) is tracked client-side only. This causes issues:
- Multiple clients tracking the same game can drift apart
- Reconnecting clients have no way to get accurate current time
- No server source of truth for "what time is it in the game"

## Proposed Solution

Include server timestamp in GraphQL responses and subscriptions:

```typescript
// Server includes in responses/subscriptions:
{
  period: "1",
  periodSecond: 847,
  serverTimestamp: 1706889600000  // Unix ms when generated
}

// Client calculates current time:
const elapsedSinceSync = (Date.now() - serverTimestamp) / 1000;
const currentPeriodSecond = periodSecond + elapsedSinceSync;
```

## Where to Send Time Sync Data

| Source | Frequency | Use Case |
|--------|-----------|----------|
| Subscription heartbeats | Every 30-60s | Keep clients in sync |
| Game event mutation responses | On each mutation | Re-sync after actions |
| Initial game query | Once on load | Bootstrap on page load |

## Benefits

- Multiple scorers stay in sync without constant polling
- Reconnecting clients immediately get accurate time
- Piggybacks on existing data flow (no extra network requests)
- Server becomes source of truth for game time

## Considerations

- Network latency: `serverTimestamp` is when server generated response, not when client received it
- May need to account for round-trip time for high precision
- Clock skew between client and server (usually negligible)
- Need to handle pause/resume states

## Related

- Play time calculation in substitution panel uses historical events, not real-time clock
- This sync is primarily for the live game timer display
