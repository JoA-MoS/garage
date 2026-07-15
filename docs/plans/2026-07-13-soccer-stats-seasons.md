# Soccer Stats Seasons and Tournaments Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add seasons to Soccer Stats so every game can be assigned to a season/tournament and team records can be tracked per season, including overlapping standalone tournaments.

**Architecture:** Introduce `Season` as a first-class team-scoped domain object. A tournament is a season with `type = TOURNAMENT`, so the same game assignment, record aggregation, and UI filtering code works for leagues and tournaments. Games get an optional `seasonId`; team records are computed from completed games in that season rather than stored as mutable counters.

**Tech Stack:** Nx monorepo, NestJS GraphQL API, TypeORM/Postgres migrations, React/Vite UI, generated GraphQL client types, Vitest/Jest tests.

---

## Current repo evidence

| Area | Evidence | Impact |
|---|---|---|
| Teams | `apps/soccer-stats/api/src/entities/team.entity.ts` has persistent teams and team membership. | Seasons should belong to teams, not replace teams. |
| Games | `apps/soccer-stats/api/src/entities/game.entity.ts` has `scheduledStart`, `status`, and `GameTeam[]`. | Add `seasonId` directly to `Game` so each game has one competition context. |
| Game team scores | `GameTeam.finalScore` exists but event-based score computation is used in `TeamStatsService`. | Season records should initially use the same event-score logic as team stats to avoid drift. |
| Team stats | `TeamStatsInput` filters by date range only; `TeamStatsService.getAggregateStats()` calculates W/D/L. | Add `seasonId` filtering as a precise alternative to date windows. |
| Existing comments | Older docs mention multi-season/tournament support as an architectural goal, but no `Season` entity exists. | This is a missing domain model, not just a UI filter. |
| UI | Dashboard/games UI already queries games and team stats through GraphQL services. | UI needs season CRUD and season selector/assignment surfaces. |

## Domain decisions

1. **Season is team-scoped.** A season belongs to the managed team whose record is being tracked. Opponent teams do not need to join the season.
2. **Tournament is a season type.** Use `SeasonType.REGULAR` and `SeasonType.TOURNAMENT`; do not create a separate tournament table yet.
3. **Games have at most one `seasonId`.** A tournament game belongs to the tournament season, not the overlapping regular season. This keeps records deterministic.
4. **Records are computed, not stored.** Store games and scores; derive W/D/L/GF/GA/GD from completed games for the selected season.
5. **Existing games remain valid.** `seasonId` is nullable. A later backfill/import tool can assign historical games.
6. **Default season selection is explicit.** New games may default to the team’s active regular season if exactly one active season exists, but UI must let the user choose/clear the season.

## Acceptance criteria

- A manager can create/edit/list/archive seasons for a team.
- Season can be marked as `REGULAR` or `TOURNAMENT`.
- Tournaments can overlap regular seasons by date because overlap validation is not enforced across `type`.
- A game can be assigned to exactly one season at creation or edit time.
- Team stats can be queried by `seasonId`, returning record for only games in that season.
- UI shows a team’s seasons and a per-season record summary.
- Dashboard/upcoming/recent game cards can display season/tournament context where available.
- Existing date-range stats continue to work.
- Existing games with no season still load and can be edited.

---

## Task 1: Add API season entity and migration

**Objective:** Create the persistent `seasons` table and link games to a nullable season.

**Files:**
- Create: `apps/soccer-stats/api/src/entities/season.entity.ts`
- Modify: `apps/soccer-stats/api/src/entities/team.entity.ts`
- Modify: `apps/soccer-stats/api/src/entities/game.entity.ts`
- Create: `apps/soccer-stats/api/src/database/migrations/<timestamp>-CreateSeasons.ts`
- Test: `apps/soccer-stats/api/src/entities/season.entity.spec.ts` if entity tests exist; otherwise validate through service tests in Task 3.

**Implementation notes:**

Create enum:

```ts
export enum SeasonType {
  REGULAR = 'REGULAR',
  TOURNAMENT = 'TOURNAMENT',
}
```

Create entity fields:

```ts
@ObjectType()
@Entity('seasons')
@Index('IDX_seasons_teamId', ['teamId'])
@Index('UQ_seasons_team_name', ['teamId', 'name'], { unique: true })
export class Season extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field()
  @Column({ length: 255 })
  name: string;

  @Field(() => SeasonType)
  @Column({ type: 'enum', enum: SeasonType, default: SeasonType.REGULAR })
  type: SeasonType;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  startsOn?: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  endsOn?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
```

Add to `Game`:

```ts
@Field(() => ID, { nullable: true })
@Column('uuid', { nullable: true })
seasonId?: string;

@Field(() => Season, { nullable: true })
@ManyToOne(() => Season, (season) => season.games, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'seasonId' })
season?: Season;
```

**Migration requirements:**

- Create `seasons` with `id`, timestamps, `teamId`, `name`, `type`, `startsOn`, `endsOn`, `isActive`, `notes`.
- Add FK `seasons.teamId -> teams.id` with `ON DELETE CASCADE`.
- Add nullable `games.seasonId` with FK `ON DELETE SET NULL`.
- Add indexes on `seasons.teamId`, `seasons(type)`, `games.seasonId`.
- Add unique constraint on `(teamId, name)`.

**Verification:**

Run:

```bash
pnpm nx test soccer-stats-api --skip-nx-cache
pnpm nx build soccer-stats-api --skip-nx-cache
```

Expected: API tests/build pass.

---

## Task 2: Add Season DTOs, module, service, and resolver

**Objective:** Expose CRUD and team-scoped list queries for seasons.

**Files:**
- Create: `apps/soccer-stats/api/src/modules/seasons/seasons.module.ts`
- Create: `apps/soccer-stats/api/src/modules/seasons/seasons.service.ts`
- Create: `apps/soccer-stats/api/src/modules/seasons/seasons.resolver.ts`
- Create: `apps/soccer-stats/api/src/modules/seasons/dto/create-season.input.ts`
- Create: `apps/soccer-stats/api/src/modules/seasons/dto/update-season.input.ts`
- Modify: `apps/soccer-stats/api/src/app/app.module.ts` or relevant module registry.
- Test: `apps/soccer-stats/api/src/modules/seasons/seasons.service.spec.ts`

**GraphQL shape:**

```graphql
type Season {
  id: ID!
  teamId: ID!
  name: String!
  type: SeasonType!
  startsOn: String
  endsOn: String
  isActive: Boolean!
  notes: String
  games: [Game!]
}

input CreateSeasonInput {
  teamId: ID!
  name: String!
  type: SeasonType = REGULAR
  startsOn: String
  endsOn: String
  notes: String
}

input UpdateSeasonInput {
  name: String
  type: SeasonType
  startsOn: String
  endsOn: String
  isActive: Boolean
  notes: String
}
```

**Resolver operations:**

- `season(id: ID!): Season!`
- `teamSeasons(teamId: ID!, includeInactive: Boolean = false): [Season!]!`
- `createSeason(input: CreateSeasonInput!): Season!`
- `updateSeason(id: ID!, input: UpdateSeasonInput!): Season!`
- `archiveSeason(id: ID!): Season!` sets `isActive = false`.

**Business rules:**

- Validate team exists before create.
- Validate `startsOn <= endsOn` when both provided.
- Do not reject overlapping seasons. This is required for tournaments.
- Enforce unique `(teamId, name)` at DB level and return a clear error message.

**Verification:**

Run:

```bash
pnpm nx test soccer-stats-api --testFile=seasons.service.spec.ts --skip-nx-cache
pnpm nx build soccer-stats-api --skip-nx-cache
```

Expected: tests/build pass.

---

## Task 3: Assign games to seasons

**Objective:** Let games carry season context from creation through update/query.

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/games/dto/create-game.input.ts`
- Modify: `apps/soccer-stats/api/src/modules/games/dto/update-game.input.ts`
- Modify: `apps/soccer-stats/api/src/modules/games/games.service.ts`
- Modify: `apps/soccer-stats/api/src/modules/games/game-fields.resolver.ts`
- Test: `apps/soccer-stats/api/src/modules/games/games.service.spec.ts`

**Input changes:**

```ts
@Field(() => ID, { nullable: true })
@IsUUID()
@IsOptional()
seasonId?: string;
```

**Create/update behavior:**

- If `seasonId` is provided, verify season exists.
- Verify season belongs to the home team or away team. Preferred MVP: it must belong to the home team, because records are team-managed and home team is the managed team in current create flow.
- Set `game.seasonId` on create.
- Allow update to change or clear `seasonId`.

**Field resolver:**

Add `Game.season` resolver using DataLoader or repository lookup. Prefer adding a `seasonByIdLoader` to existing dataloaders if consistent with current pattern.

**Tests:**

- Create game with valid `seasonId` stores it.
- Create game with unknown `seasonId` throws `NotFoundException`.
- Create game with season from unrelated team throws validation error.
- Update game can set and clear `seasonId`.

**Verification:**

Run:

```bash
pnpm nx test soccer-stats-api --testFile=games.service.spec.ts --skip-nx-cache
pnpm nx build soccer-stats-api --skip-nx-cache
```

---

## Task 4: Add season-aware team record/stat queries

**Objective:** Compute winning record for a specific season/tournament.

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/team-stats/dto/team-stats-input.ts`
- Modify: `apps/soccer-stats/api/src/modules/team-stats/team-stats.service.ts`
- Create: `apps/soccer-stats/api/src/modules/team-stats/dto/team-season-record.output.ts` if a smaller query is desired.
- Modify: `apps/soccer-stats/api/src/modules/team-stats/team-stats.resolver.ts`
- Test: `apps/soccer-stats/api/src/modules/team-stats/team-stats.service.spec.ts`

**Input change:**

```ts
@Field(() => ID, { nullable: true, description: 'Season/tournament ID to filter stats by' })
seasonId?: string;
```

**Service behavior:**

- If `seasonId` is present, filter `GameTeam` joins with `g."seasonId" = :seasonId`.
- If `seasonId` is present, ignore `startDate` / `endDate` or reject mixed usage. Recommended: reject mixed usage with a clear validation error to avoid ambiguous stats.
- Continue using event-based scores from `getEventScoresByGameIds()` for W/D/L/GF/GA so the season record matches existing aggregate stats behavior.

**Optional focused query:**

```graphql
teamSeasonRecord(teamId: ID!, seasonId: ID!): TeamAggregateStats!
```

This can delegate to `getTeamStats({ teamId, seasonId }).aggregateStats`.

**Tests:**

- Completed games in the selected season count toward W/D/L.
- Completed games in other seasons do not count.
- Scheduled/in-progress games do not count toward record.
- Tournament season records work the same as regular season records.

**Verification:**

Run:

```bash
pnpm nx test soccer-stats-api --testFile=team-stats.service.spec.ts --skip-nx-cache
pnpm nx build soccer-stats-api --skip-nx-cache
```

---

## Task 5: Update GraphQL documents and generated types

**Objective:** Make UI codegen aware of seasons and season assignment.

**Files:**
- Modify GraphQL documents in `apps/soccer-stats/ui/src/app/services/*.graphql.service.ts` as applicable.
- Modify: `libs/soccer-stats/graphql-codegen/src/generated/graphql.ts` via codegen command, not by hand.

**Document updates:**

- Add `season { id name type }` to game queries used by dashboard, game details, team games, and history.
- Add `seasonId` variable to create/update game mutations.
- Add season queries/mutations:
  - `GetTeamSeasons`
  - `CreateSeason`
  - `UpdateSeason`
  - `ArchiveSeason`
  - `GetTeamStats` with `seasonId`

**Verification:**

Run the repo’s GraphQL codegen target. Inspect `project.json` for the exact target, likely:

```bash
pnpm nx run soccer-stats-graphql-codegen:codegen
```

Then run:

```bash
pnpm nx build soccer-stats-ui --skip-nx-cache
```

---

## Task 6: Add UI season management surfaces

**Objective:** Let managers create/manage regular seasons and tournaments from the team context.

**Files:**
- Create: `apps/soccer-stats/ui/src/app/pages/team-seasons.page.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/smart/team-seasons.smart.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/presentation/season-card.presentation.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/presentation/season-form.presentation.tsx`
- Modify: `apps/soccer-stats/ui/src/app/router/router.tsx`
- Modify team page/settings navigation to link to seasons.
- Test: corresponding component tests if this repo has a nearby pattern; otherwise add helper tests and run build.

**UI behavior:**

- Team page has a `Seasons` entry.
- List active seasons first, then archived.
- Badge type: `Regular` or `Tournament`.
- Show date range if present.
- Show computed record summary once Task 7 exists.
- Create/edit form fields: name, type, startsOn, endsOn, notes, active.
- Do not block overlapping dates in UI.

**Verification:**

Run:

```bash
pnpm nx test soccer-stats-ui --skip-nx-cache --runInBand
pnpm nx build soccer-stats-ui --skip-nx-cache
```

---

## Task 7: Add season selector to game create/edit flows

**Objective:** Assign games to a season/tournament when scheduled or edited.

**Files:**
- Modify the game creation smart/presentation components under `apps/soccer-stats/ui/src/app/components/...` and/or `pages/game.page.tsx` depending on current create flow.
- Modify relevant GraphQL service documents.
- Test: component test or focused helper test for default season selection.

**Behavior:**

- When home team changes, fetch active seasons for that team.
- If exactly one active regular season exists and no tournament is selected, preselect it.
- User can choose any active season/tournament or choose `No season`.
- Tournaments should be visibly labelled in the dropdown.
- On submit, include `seasonId` in `CreateGameInput`.
- In edit flow, allow moving a game between seasons or clearing the season.

**Verification:**

- Create game with regular season selected: game detail query returns season.
- Create game with tournament selected: stats filtered by tournament include it.
- Create game with no season: existing behavior still works.

---

## Task 8: Display season records and season context

**Objective:** Make season/tournament records visible where Justin will use them.

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/pages/dashboard.page.tsx`
- Modify team overview/stats pages.
- Modify recent/upcoming game cards to display `season.name` where useful.
- Add record component: `apps/soccer-stats/ui/src/app/components/presentation/season-record-badge.presentation.tsx`

**UI behavior:**

- Team seasons list shows each season’s record: `W-L-D`, `GF`, `GA`, `GD`.
- Tournament seasons use the same record display, with a tournament badge.
- Game cards may show context like `Summer 2026` or `State Cup` below venue/date.
- Team stats page includes a season filter dropdown.

**Verification:**

Run UI tests/build and manually smoke with seeded data.

---

## Task 9: Seed/demo data for seasons and tournaments

**Objective:** Make local/dev environments demonstrate the feature.

**Files:**
- Modify: `apps/soccer-stats/api/database/seeds/seed-dev-data.sql`
- Optional: add migration-safe seed script if existing seed pattern supports it.

**Seed behavior:**

- Create one regular season for a managed team, e.g. `Spring 2026`.
- Create one tournament season, e.g. `Memorial Day Tournament`.
- Assign existing demo games to those seasons.
- Ensure at least one completed game in each season for record display.

**Verification:**

Run local app and verify:

- Team seasons page lists both seasons.
- Regular season and tournament records differ.
- Dashboard game cards show real season context.

---

## Task 10: Final integration checks and PR

**Objective:** Prove the feature works end-to-end and prepare for review.

**Commands:**

```bash
pnpm nx test soccer-stats-api --skip-nx-cache
pnpm nx test soccer-stats-ui --skip-nx-cache --runInBand
pnpm nx build soccer-stats-api --skip-nx-cache
pnpm nx build soccer-stats-ui --skip-nx-cache
pnpm nx lint soccer-stats-api
pnpm nx lint soccer-stats-ui
```

**Manual smoke:**

1. Create a team season.
2. Create a tournament season for the same team with overlapping dates.
3. Schedule one game in the regular season.
4. Schedule one game in the tournament.
5. Complete both games with different results.
6. Confirm regular season record only includes the regular game.
7. Confirm tournament record only includes tournament game.
8. Confirm unassigned games still appear in history and do not break stats.

**PR notes:**

- Mention nullable `seasonId` backward compatibility.
- Mention tournaments are implemented as `SeasonType.TOURNAMENT`.
- Mention records are computed from completed games, not stored.
- Include screenshots of team seasons list and game create season selector if possible.

---

## Risks and follow-ups

| Risk | Mitigation |
|---|---|
| Existing games have no season. | Keep `seasonId` nullable and add future bulk assignment/backfill UI. |
| Multiple managed teams in one game. | MVP validates season belongs to home team; revisit if away managed team workflows matter. |
| Event-derived scores vs `finalScore` drift. | Reuse existing `TeamStatsService` event-score logic for season records. |
| Tournaments with brackets need more structure. | Treat tournament as season now; add bracket/pool metadata later only when needed. |
| Overlapping seasons can confuse default selection. | Only auto-select if exactly one active regular season exists; otherwise require user choice. |

## Recommended implementation order

1. API schema/migration.
2. Season CRUD service/resolver.
3. Game season assignment.
4. Season-aware team stats.
5. GraphQL codegen.
6. UI management and selector.
7. Record display and dashboard context.
8. Seeds and final verification.

This keeps the database foundation stable before UI work and avoids bolting tournament logic onto date filters. Date filters are a reporting convenience; seasons are the domain concept.
