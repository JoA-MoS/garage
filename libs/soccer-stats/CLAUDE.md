# Soccer Stats Shared Libraries

The soccer-stats domain has shared libraries with distinct purposes:

**`@garage/soccer-stats/graphql-codegen`** (non-buildable)

- Auto-generated TypeScript types from GraphQL schema
- Contains enums like `StatsTrackingLevel`, `GameStatus`, etc.
- Used by the UI app for type-safe GraphQL operations
- Regenerated via `pnpm nx graphql-codegen soccer-stats-ui`

**`@garage/soccer-stats/ui-components`** (buildable)

- Reusable React presentation components
- Decoupled from GraphQL/service layer types
- Uses its own `UI*` prefixed types (e.g., `UIStatsTrackingLevel`, `UITeam`)
- Can be consumed by any React app without GraphQL dependencies

**Type Decoupling Pattern:**

The ui-components library maintains its own type definitions in `libs/soccer-stats/ui-components/src/lib/types/index.ts`. This is required because:

1. **Module boundary constraint:** Buildable libraries cannot import from non-buildable libraries (like graphql-codegen)
2. **Decoupling benefit:** Presentation components remain independent of GraphQL schema changes
3. **Type compatibility:** UI types use the same underlying string values as GraphQL types, allowing safe casting at consumption points

```typescript
// In ui-components/types/index.ts
export enum UIStatsTrackingLevel {
  Full = 'FULL',           // Matches GraphQL StatsTrackingLevel.Full
  ScorerOnly = 'SCORER_ONLY',
  GoalsOnly = 'GOALS_ONLY',
}

// In consuming app (cast between compatible types)
import { UIStatsTrackingLevel } from '@garage/soccer-stats/ui-components';
import { StatsTrackingLevel } from '@garage/soccer-stats/graphql-codegen';

<TeamStatsTrackingRadioGroup
  currentLevel={graphqlValue as UIStatsTrackingLevel}
  onSelect={(level) => handleChange(level as StatsTrackingLevel)}
/>
```

**Adding New Components:**

1. Create component directory under `libs/soccer-stats/ui-components/src/lib/components/`
2. Add `index.ts` that exports the component and its props type
3. Add export to `components/index.ts` barrel file
4. If new types are needed, add UI-prefixed types to `types/index.ts`

**`@garage/soccer-stats/utils`**

- Shared utility functions for soccer-stats domain
- Pure TypeScript utilities without framework dependencies

**`@garage/soccer-stats/infra`**

- Shared infrastructure utilities for Pulumi deployments
- Used by `api-infra` and `ui-infra` projects
