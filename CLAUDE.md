# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Garage is an Nx monorepo containing multiple full-stack applications and shared libraries. The workspace uses pnpm for package management and includes React/Angular frontends, NestJS/Express backends, AWS Lambda functions, and shared TypeScript libraries.

**Key Technologies:**

- **Build System:** Nx 21.4.1 monorepo with intelligent caching
- **Package Manager:** pnpm (specified in package.json packageManager field)
- **Node Version:** v24.4.1 (see .nvmrc)
- **Frontend:** React 18.3.1 with Vite, Angular 20.1.8
- **Backend:** NestJS 11.0.0, Express 4.21.2
- **Database:** PostgreSQL 15 with TypeORM 0.3.17
- **GraphQL:** Apollo Server/Client with GraphQL Code Generator
- **Testing:** Vitest 3.2.4, Jest 30.0.5, Playwright
- **Styling:** Tailwind CSS 3.4.3 (primary styling approach)

## Common Development Commands

### Environment Setup

```bash
# Use Node.js v24.4.1 (choose nvm OR fnm)
nvm use                    # if using nvm
fnm use                    # if using fnm

# Enable pnpm
corepack enable

# Install dependencies (takes ~100 seconds, NEVER cancel)
pnpm install --frozen-lockfile --ignore-scripts
```

### Building, Testing, and Linting

```bash
# Lint all projects (takes ~1 second)
pnpm nx run-many --target=lint --all --parallel=3

# Test all projects (takes ~1 second)
pnpm nx run-many --target=test --all --parallel=2

# Build all projects (takes ~1 second)
pnpm nx run-many --target=build --all --parallel=3

# Work with specific projects
pnpm nx build <project-name>
pnpm nx test <project-name>
pnpm nx serve <project-name>
```

### GraphQL Code Generation

The soccer-stats-ui project uses GraphQL Code Generator to create TypeScript types from the GraphQL schema:

```bash
# Generate types once (run from workspace root)
pnpm nx graphql-codegen soccer-stats-ui

# Watch mode (automatically regenerates on schema/query changes)
pnpm nx graphql-codegen-watch soccer-stats-ui

# Or use the root-level scripts
pnpm codegen
pnpm codegen:watch
```

**Generated Files Location:** `apps/soccer-stats/ui/src/app/generated/`

**Important:** The GraphQL Code Generator is configured to use TypedDocumentNode mode for Apollo Client compatibility. Generated files are automatically formatted with Prettier.

### Project Discovery

```bash
# List all projects in workspace
pnpm nx show projects

# Get details about a specific project
pnpm nx show project <project-name>

# Visualize project dependencies
pnpm nx graph
```

### Nx MCP Server Tools

**IMPORTANT:** This workspace has an Nx MCP server configured. Prefer using these MCP tools over bash commands when working with Nx:

| Tool                                        | Purpose                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `mcp__nx__nx_workspace`                     | Get project graph and nx.json configuration                            |
| `mcp__nx__nx_project_details`               | Get detailed configuration for a specific project                      |
| `mcp__nx__nx_current_running_tasks_details` | **Check status of running Nx tasks** (builds, tests, serves)           |
| `mcp__nx__nx_current_running_task_output`   | Get terminal output from a specific running task                       |
| `mcp__nx__nx_docs`                          | Look up Nx documentation for questions about configuration or features |
| `mcp__nx__nx_generators`                    | List all available Nx generators                                       |
| `mcp__nx__nx_generator_schema`              | Get the schema/options for a specific generator                        |
| `mcp__nx__nx_run_generator`                 | Open Nx Console Generate UI with pre-filled options                    |
| `mcp__nx__nx_visualize_graph`               | Visualize project or task dependency graph                             |
| `mcp__nx__nx_available_plugins`             | List available Nx plugins                                              |

**When to use MCP tools vs bash:**

- **Checking task status:** Use `mcp__nx__nx_current_running_tasks_details` instead of parsing bash output
- **Getting project info:** Use `mcp__nx__nx_project_details` instead of `pnpm nx show project`
- **Looking up Nx docs:** Use `mcp__nx__nx_docs` for questions about Nx configuration, options, or best practices
- **Running generators:** Use `mcp__nx__nx_run_generator` to open the IDE's Generate UI with options pre-filled
- **Debugging build failures:** Use `mcp__nx__nx_current_running_task_output` to get logs from running or recent tasks

### Database Management (soccer-stats-api)

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

**Database Initialization:** SQL scripts in `apps/soccer-stats-api/database/init/` run automatically on first container start.

## High-Level Architecture

### Monorepo Structure

This is an Nx monorepo with apps and libraries organized by domain:

```
apps/
├── auth/api/              # Authentication services (Express & NestJS variants)
├── campsite-watcher/      # Campsite availability monitoring service
├── campsite-watcher-lambda/ # AWS Lambda version
├── chore-board/           # Kanban-style chore tracking app
│   ├── api/              # NestJS backend
│   └── ui/               # React frontend with drag-drop
├── ng/example/            # Angular example application
├── soccer-stats/          # Soccer statistics tracker (primary app)
│   ├── api/              # NestJS GraphQL backend
│   ├── api-e2e/          # E2E tests for API
│   ├── ui/               # React/Vite frontend
│   └── ui-e2e/           # E2E tests for UI
└── nx-kaniko/             # Docker build utilities

libs/
├── campsite-watcher/      # Shared campsite watcher libraries
│   ├── core/             # Core logic
│   └── recreation-gov/   # Recreation.gov API integration
├── ng/lib-example/        # Shared Angular components
└── wordle/core/           # Wordle game logic
```

### Soccer Stats Tracker (Primary Application)

The soccer-stats application is a full-stack youth soccer statistics tracking system.

**Architecture Pattern:**

- **Backend:** NestJS with GraphQL API (Apollo Server)
- **Frontend:** React with Apollo Client
- **Database:** PostgreSQL with TypeORM entities
- **Code Generation:** GraphQL Code Generator for type-safe queries/mutations

**Backend Structure (`apps/soccer-stats/api/src/`):**

```
app/
├── app.module.ts          # Root module with GraphQL configuration
├── app.controller.ts      # Health check endpoints
└── startup.service.ts     # Database initialization

entities/                  # TypeORM database entities
├── base.entity.ts
├── user.entity.ts
├── team*.entity.ts
├── player.entity.ts
└── game*.entity.ts

modules/                   # Feature modules (NestJS + TypeGraphQL)
├── auth/                  # Authentication & authorization
├── users/                 # User management
├── teams/                 # Team CRUD & relationships
├── players/               # Player management
├── coaches/               # Coach assignments
├── games/                 # Game tracking
└── game-formats/          # Game format configurations
```

**Frontend Structure (`apps/soccer-stats/ui/src/app/`):**

```
components/                # Reusable UI components
pages/                     # Route-level page components
router/                    # React Router configuration
services/                  # API integration services
providers/                 # React context providers
generated/                 # GraphQL codegen output (auto-generated)
types/                     # TypeScript type definitions
```

**GraphQL Integration:**

1. Backend exposes GraphQL schema at `http://localhost:3333/api/graphql`
2. Frontend queries/mutations are defined in `.tsx` files using `gql` template tags
3. GraphQL Code Generator reads the schema and frontend documents
4. Generates TypeScript types and Apollo Client hooks in `generated/`
5. Frontend imports type-safe hooks (e.g., `useGetPlayersQuery`)

**Key Entities & Relationships:**

- **User:** Authentication and profile
- **Team:** Can be managed (with roster) or unmanaged (ad-hoc)
- **TeamPlayer/TeamCoach:** Junction tables for team rosters
- **Game:** Tracks matches with format, teams, and statistics
- **GameFormat:** Defines rules (e.g., 3v3, 5v5, duration)

### NestJS Module Pattern

All NestJS applications follow a consistent module structure:

```typescript
module/
├── module.module.ts       # Feature module declaration
├── module.service.ts      # Business logic
├── module.resolver.ts     # GraphQL resolvers (Type-GraphQL decorators)
├── entities/             # TypeORM entities (if applicable)
└── dto/                  # Data transfer objects
```

**TypeORM + TypeGraphQL Integration:**

- Entities use both `@Entity()` (TypeORM) and `@ObjectType()` (TypeGraphQL) decorators
- Resolvers use `@Resolver()`, `@Query()`, `@Mutation()` decorators
- Services handle database operations via TypeORM repositories

### Path Aliases

TypeScript path aliases are defined in `tsconfig.base.json`:

```typescript
"@garage/campsite-watcher/core"           → libs/campsite-watcher/core/src/index.ts
"@garage/campsite-watcher/recreation-gov" → libs/campsite-watcher/recreation-gov/src/index.ts
"@garage/ng/lib-example"                  → libs/ng/lib-example/src/index.ts
"@garage/wordle/core"                     → libs/wordle/core/src/index.ts
```

Use these aliases when importing from shared libraries.

## Styling with Tailwind CSS

**Primary Styling Approach:** All applications should use Tailwind CSS utility classes for styling. The workspace has Tailwind configured for both React and Angular apps.

**Mobile-First Development:** All UI components must follow a mobile-first approach. Design for mobile screens first (320px+), then progressively enhance for larger screens using responsive prefixes (`sm:`, `md:`, `lg:`).

**Tailwind Configuration Files:**

- React apps: `tailwind.config.js` + `postcss.config.js` (see chore-board-ui for reference)
- Angular apps: `tailwind.config.js` (see ng-example for reference)

**Available Custom Utilities:**

- `@savvywombat/tailwindcss-grid-areas` plugin for CSS Grid Areas
- Custom `backgroundImage.checkered` pattern
- Custom grid template areas/columns/rows (see chore-board-ui config)

**Prettier Integration:** The workspace includes `prettier-plugin-tailwindcss` which automatically sorts Tailwind classes in the recommended order.

## Development Workflow

### Serving Applications

**Soccer Stats (Full Stack):**

```bash
# Serve UI (auto-starts API and GraphQL codegen watch)
pnpm nx serve soccer-stats-ui

# Or manually control each piece
pnpm nx serve:dev soccer-stats-api  # Starts DB + API
pnpm nx graphql-codegen-watch soccer-stats-ui  # Watch mode for codegen
pnpm nx serve soccer-stats-ui        # Dev server with HMR
```

The `serve` target for soccer-stats-ui automatically starts its dependencies (API server and GraphQL codegen watch) via the `dependsOn` configuration.

**Other Applications:**

```bash
pnpm nx serve chore-board-ui    # React kanban board
pnpm nx serve chore-board-api   # NestJS API
pnpm nx serve ng-example        # Angular app
```

### Testing Strategy

- **Unit Tests:** Vitest (React apps), Jest (NestJS apps, Angular apps)
- **E2E Tests:** Playwright (configured for soccer-stats)
- Tests run in parallel with `--parallel=2` for performance

### Nx Cloud and Caching

**Important:** Nx Cloud connectivity may fail in sandbox/restricted environments with exit code 1, but this does not affect build/test success. Look for "Successfully ran target" messages to verify actual success.

**Caching:** Nx uses intelligent caching for build, test, and lint targets. Builds may not produce visible `dist/` folders if results are served from cache.

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

## Important Notes

- **Node Version:** Must use v24.4.1 (specified in `.nvmrc`). Use `nvm use` or `fnm use` in each session.
- **Package Manager:** Use `pnpm` exclusively (not npm or yarn). The exact version is specified in package.json.
- **Timeout Settings:** Set command timeouts to 300+ seconds for safety, even though most complete in 1-3 seconds.
- **Nx Plugins:** The workspace uses `useInferencePlugins: false`, so all project configuration is explicit in `project.json` files.
- **Git Hooks:** Husky runs `lint --fix` and `prettier --write` automatically on commit.
- **Conventional Commits:** All commits must follow the Conventional Commits standard (feat:, fix:, docs:, etc.).
- **Docker:** Some apps (campsite-watcher) have `docker-build` targets requiring Docker daemon.

## Project Tags

Projects use Nx tags for organization:

- `type:app` - User-facing applications
- `type:api` - Backend services
- `domain:sports` - Soccer statistics domain
- Use `nx show project <name>` to see tags for any project

## CI/CD

GitHub Actions workflow (`.github/workflows/main.yml`) handles linting, testing, building, and Docker builds for affected projects.

## GitHub Workflow

- **Pull Requests:** Always create PRs in **draft status first**. This allows for review and validation before marking as ready for review.

## Additional Resources

For detailed development standards, see:

- `.github/copilot-instructions.md` - Comprehensive development guidelines
- `.github/instructions/coding-standards.instructions.md` - Code quality standards
- `.github/instructions/react-component-patterns.instructions.md` - React patterns
- `.github/instructions/nx.instructions.md` - Nx-specific workflows
- `README.md` - General Nx documentation
- `Soccer Stats Tracker - Project Summary.md` - Project overview
- `Soccer Stats Tracker - Backend Development Summary.md` - Backend architecture details
