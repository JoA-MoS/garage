# Soccer Stats API

### Database Management

The soccer-stats-api uses PostgreSQL with Docker:

```bash
# Start database
pnpm nx db:start soccer-stats-api

# Stop database
pnpm nx db:stop soccer-stats-api

# Reset database (warning: destroys data)
pnpm nx db:reset soccer-stats-api

# View database logs
pnpm nx db:logs soccer-stats-api

# Start database and serve API together
pnpm nx serve:dev soccer-stats-api
```

**Database Access:**

- PostgreSQL: `localhost:5432` (user/pass: postgres/postgres, db: soccer_stats)
- Adminer (web UI): `http://localhost:8080`

**Database Initialization:** SQL scripts in `apps/soccer-stats/api/database/init/` run automatically on first container start.

### Database Migrations

The soccer-stats-api uses TypeORM migrations for schema changes. **Never use `synchronize: true` in production.**

```bash
# Show migration status
pnpm nx migration:show soccer-stats-api

# Generate a new migration from entity changes
pnpm nx migration:generate soccer-stats-api --name=AddUserEmail

# Run pending migrations
pnpm nx migration:run soccer-stats-api

# Revert the last migration
pnpm nx migration:revert soccer-stats-api
```

**Migration Workflow:**

1. **Modify entities** - Update TypeORM entity files in `apps/soccer-stats/api/src/entities/`
2. **Generate migration** - Run `migration:generate` to create a migration file
3. **Review migration** - Check the generated SQL in `apps/soccer-stats/api/src/database/migrations/`
4. **Run migration** - Apply with `migration:run`
5. **Commit both** - Commit entity changes AND migration file together

**Configuration Files:**

| File                         | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `database/typeorm.config.ts` | Shared config for NestJS app and CLI   |
| `database/data-source.ts`    | CLI-specific DataSource for migrations |
| `database/migrations/*.ts`   | Migration files (auto-generated)       |

**Environment Variables:**

- `DB_SYNCHRONIZE=false` - **Must be false** when using migrations (default)
- Migrations use `.env` file via Nx's `envFile` option in project.json

**Baseline Migration:**

The `InitialSchema` migration represents the database state before migrations were enabled. The `StartupService` automatically registers this baseline migration on existing databases during app startup.

### DataLoader Pattern for N+1 Prevention (Required for GraphQL APIs)

**All GraphQL field resolvers that load related entities must use DataLoader.** This solves the N+1 query problem by batching multiple individual database lookups into a single query.

**Key Components:**

1. **DataLoadersService** - Injectable service that creates fresh DataLoader instances per request:

```typescript
@Injectable()
export class DataLoadersService {
  constructor(
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    // ... other repositories
  ) {}

  createLoaders(): IDataLoaders {
    return {
      gameLoader: new DataLoader<string, Game>(async (ids) => {
        const games = await this.gameRepo.find({ where: { id: In([...ids]) } });
        const gameMap = new Map(games.map((g) => [g.id, g]));
        return ids.map((id) => gameMap.get(id)!);
      }),
      // ... other loaders
    };
  }
}
```

2. **GraphQL Context** - Loaders are created per-request in the context factory:

```typescript
GraphQLModule.forRootAsync({
  imports: [DataLoadersModule],
  inject: [DataLoadersService],
  useFactory: (dataLoadersService: DataLoadersService) => ({
    context: ({ req }) => ({
      req,
      loaders: dataLoadersService.createLoaders(), // Fresh loaders per request
    }),
  }),
});
```

3. **Field Resolvers** - Use DataLoaders instead of direct repository calls:

```typescript
@Resolver(() => GameTeam)
export class GameTeamResolver {
  @ResolveField(() => Team)
  async team(@Parent() gameTeam: GameTeam, @Context() ctx: GraphQLContext): Promise<Team> {
    // Check if already loaded (eager loading optimization)
    if (gameTeam.team) return gameTeam.team;
    // Use DataLoader to batch the query
    return ctx.loaders.teamLoader.load(gameTeam.teamId);
  }
}
```

**Why This Pattern Matters:**

- **Without DataLoader**: 10 GameTeams → 10 separate `SELECT * FROM team WHERE id = ?` queries
- **With DataLoader**: 10 GameTeams → 1 `SELECT * FROM team WHERE id IN (?, ?, ...)` query

**DataLoader Provides Per-Request Memoization:**

- Same entity requested multiple times in one request → only one database call
- Fresh cache per request → no stale data across requests

**When to Create a New DataLoader:**

| Relationship Type | DataLoader Pattern                                     |
| ----------------- | ------------------------------------------------------ |
| Many-to-One (FK)  | `entityLoader: DataLoader<string, Entity>`             |
| One-to-Many       | `entitiesByParentLoader: DataLoader<string, Entity[]>` |

**Anti-pattern:** Using eager loading (`relations: ['team']`) everywhere. This fetches data even when not queried. Use DataLoaders + field resolvers for on-demand loading.
