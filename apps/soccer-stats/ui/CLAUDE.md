# Soccer Stats UI

### GraphQL Code Generation

The soccer-stats projects use GraphQL Code Generator to create TypeScript types from the GraphQL schema:

```bash
# Generate types once (run from workspace root)
pnpm nx run soccer-stats-graphql-codegen:codegen

# Or run with watch mode
pnpm nx run soccer-stats-graphql-codegen:codegen-watch
```

**Generated Files Location:** `libs/soccer-stats/graphql-codegen/src/generated/`

**Important:** The GraphQL Code Generator is configured to use TypedDocumentNode mode for Apollo Client compatibility. Generated files are automatically formatted with Prettier.

**Auto-Watch Mode:** When running `pnpm nx serve soccer-stats-ui`, the codegen runs in watch mode automatically as a dependency. You can verify this and other running tasks using the Nx MCP tools:

- `mcp__nx__nx_current_running_tasks_details` - Check what Nx tasks are currently running
- `mcp__nx__nx_current_running_task_output` - Get logs from a specific running task

This is useful when debugging build issues or verifying that codegen is regenerating after schema changes.

**Note:** Generated GraphQL types are imported from `@garage/soccer-stats/graphql-codegen`, not from a local folder.

**GraphQL Integration:**

1. Backend exposes GraphQL schema at `http://localhost:3333/api/graphql`
2. Frontend queries/mutations are defined in `.tsx` files using `gql` template tags
3. GraphQL Code Generator reads the schema and frontend documents
4. Generates TypeScript types and Apollo Client hooks in `generated/`
5. Frontend imports type-safe hooks (e.g., `useGetPlayersQuery`)

## GraphQL Code Generator Workflow

When working with GraphQL in soccer-stats:

1. **Define queries/mutations** in frontend `.tsx` files:

   ```typescript
   import { gql } from '@apollo/client';

   const GET_PLAYERS = gql`
     query GetPlayers {
       players {
         id
         name
       }
     }
   `;
   ```

2. **Run codegen** (or use watch mode during development):

   ```bash
   pnpm nx graphql-codegen soccer-stats-ui
   ```

3. **Import generated hooks** from `generated/`:

   ```typescript
   import { useGetPlayersQuery } from '../generated/graphql';

   const { data, loading } = useGetPlayersQuery();
   ```

**Configuration:** See `apps/soccer-stats/ui/codegen.ts` for GraphQL Code Generator setup.

### Colocated Fragments Pattern (Required for New Development)

**All new GraphQL-powered components must use the colocated fragments pattern.** This ensures a single network request per page load by design:

1. **Smart components** define fragments for their data needs (never queries)
2. **Composition components** compose child fragments into a single query
3. **One request** fetches all data - no query waterfalls

```typescript
// Smart component defines fragment
export const PlayerCardFragment = graphql(`
  fragment PlayerCard on Player {
    id
    name
    jerseyNumber
  }
`);

// Composition component spreads fragments into ONE query
const GetPlayersQuery = graphql(`
  query GetPlayers {
    players {
      id
      ...PlayerCard
    }
  }
`);
```

**Anti-pattern:** Smart components making their own `useQuery` calls. This creates multiple independent requests and defeats the purpose of the fragment architecture.

See `.github/instructions/react-component-patterns.instructions.md` for detailed examples and rules.

### Query-Then-Subscribe Pattern (Required for Real-Time Features)

**All real-time features must use the Query-Then-Subscribe pattern.** This ensures efficient data loading with minimal network overhead for updates.

**The Pattern:**

1. **Initial Query** - Use `useQuery` to fetch the complete dataset on page load
2. **Subscribe After Load** - Attach subscription via `subscribeToMore` on the query result
3. **Delta Updates** - Subscription sends only changes (CREATED/UPDATED/DELETED), not full state
4. **Cache Merge** - Subscription handler updates Apollo cache; UI re-renders automatically

```typescript
// ✅ CORRECT: Query-Then-Subscribe with subscribeToMore
function GamePage({ gameId }: { gameId: string }) {
  const { data, loading, subscribeToMore } = useQuery(GET_GAME_BY_ID, {
    variables: { gameId },
  });

  // Subscribe to updates AFTER query loads, tied to query lifecycle
  useEffect(() => {
    if (!data) return;

    const unsubscribe = subscribeToMore({
      document: GAME_EVENT_CHANGED,
      variables: { gameId },
      updateQuery: (prev, { subscriptionData }) => {
        const payload = subscriptionData.data?.gameEventChanged;
        if (!payload) return prev;

        switch (payload.action) {
          case 'CREATED':
            // Merge new event into cache
            return {
              ...prev,
              game: {
                ...prev.game,
                events: [...prev.game.events, payload.event],
              },
            };
          case 'DELETED':
            // Remove event from cache
            return {
              ...prev,
              game: {
                ...prev.game,
                events: prev.game.events.filter((e) => e.id !== payload.deletedEventId),
              },
            };
          default:
            return prev;
        }
      },
    });

    return () => unsubscribe();
  }, [data, gameId, subscribeToMore]);

  // ... render using data
}
```

**Why This Pattern:**

| Benefit             | Explanation                                        |
| ------------------- | -------------------------------------------------- |
| Single initial load | Full data fetched once via query                   |
| Minimal bandwidth   | Subscriptions send only deltas, not full state     |
| Automatic cleanup   | `subscribeToMore` unsubscribes when query unmounts |
| No race conditions  | Subscription starts after data exists in cache     |
| Cache consistency   | Updates merge into same cache entry as query       |

**Backend Subscription Design:**

Subscriptions must emit action-based payloads with minimal data:

```typescript
// ✅ CORRECT: Action-based delta payload
@ObjectType()
export class GameEventSubscriptionPayload {
  @Field(() => GameEventAction)
  action: GameEventAction; // CREATED | UPDATED | DELETED

  @Field(() => GameEvent, { nullable: true })
  event?: GameEvent; // The created/updated event

  @Field(() => ID, { nullable: true })
  deletedEventId?: string; // Only for DELETED action
}
```

**Anti-patterns to Avoid:**

```typescript
// ❌ WRONG: Independent useSubscription (no query coordination)
const { data: queryData } = useQuery(GET_GAME);
const { data: subData } = useSubscription(GAME_EVENTS);  // Race condition risk!

// ❌ WRONG: Subscription pushes full state
subscription GameEvents($gameId: ID!) {
  gameEvents(gameId: $gameId) {
    # Don't send ALL events every time one changes
    allEvents { id name ... }
  }
}

// ❌ WRONG: Refetching query when subscription fires
onSubscriptionData: () => {
  refetch();  // Defeats the purpose - just use polling instead
}

// ❌ WRONG: Managing subscription data in React state
const [events, setEvents] = useState([]);
useSubscription(GAME_EVENTS, {
  onData: ({ data }) => setEvents(prev => [...prev, data.event])  // Duplicates cache!
});
```

**When to Refetch Instead of Cache Update:**

Some updates affect derived/computed fields that the client can't calculate. Use selective refetch for these:

```typescript
// Stats-affecting events require server recalculation
const STATS_AFFECTING_EVENTS = ['SUBSTITUTION_IN', 'PERIOD_START', 'PERIOD_END'];

if (STATS_AFFECTING_EVENTS.includes(payload.event.eventType.name)) {
  // Refetch specific queries that have computed fields
  apolloClient.refetchQueries({ include: [GET_GAME_ROSTER] });
}
```

**Current Implementation Status:**

The game page (`apps/soccer-stats/ui/src/app/pages/game.page.tsx`) uses independent `useSubscription` hooks with callback-based cache updates. This works but should be refactored to use `subscribeToMore` for better lifecycle management. New real-time features must use the `subscribeToMore` pattern from the start.
