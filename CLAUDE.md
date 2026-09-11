# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Garage is an Nx monorepo containing multiple full-stack applications and shared libraries. The workspace uses pnpm for package management and includes React/Angular frontends, NestJS/Express backends, AWS Lambda functions, and shared TypeScript libraries.

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

## High-Level Architecture

### Monorepo Structure

Apps live under `apps/`, shared libraries under `libs/`, organized by domain. Run `pnpm nx show projects` or `ls apps libs` to see the current layout.

### Soccer Stats Tracker (Primary Application)

The soccer-stats application is a full-stack youth soccer statistics tracking system. See `apps/soccer-stats/CLAUDE.md` for architecture and key entities, `apps/soccer-stats/api/CLAUDE.md` for backend/DataLoader conventions, `apps/soccer-stats/ui/CLAUDE.md` for GraphQL codegen and frontend patterns, and `libs/soccer-stats/CLAUDE.md` for the shared libraries.

### NestJS Module Pattern

All NestJS applications follow a consistent module structure (`module.module.ts`, `module.service.ts`, `module.resolver.ts`, `entities/`, `dto/`).

**TypeORM + TypeGraphQL Integration:**

- Entities use both `@Entity()` (TypeORM) and `@ObjectType()` (TypeGraphQL) decorators
- Resolvers use `@Resolver()`, `@Query()`, `@Mutation()` decorators
- Services handle database operations via TypeORM repositories

### Path Aliases

TypeScript path aliases are defined in `tsconfig.base.json` under the `@garage/*` namespace. Use these aliases when importing from shared libraries.

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

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `mcp__nx-mcp__nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `mcp__nx-mcp__nx_project_details` tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `mcp__nx-mcp__nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `mcp__nx-mcp__nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- Use `mcp__nx-mcp__nx_generators` to list available generators and `mcp__nx-mcp__nx_generator_schema` to get generator options
- For CI/CD analytics, use `mcp__nx-mcp__ci_information` to check pipeline status for the current branch
- Note: Live task output monitoring tools (`nx_current_running_tasks_details`, `nx_current_running_task_output`) are documented in some versions but may not be available - use bash to monitor running processes if needed

<!-- nx configuration end-->
