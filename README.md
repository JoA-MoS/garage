# Garage

An Nx monorepo containing multiple full-stack applications and shared libraries. The workspace includes React/Angular frontends, NestJS/Express backends, AWS Lambda functions, and shared TypeScript libraries.

<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="450"></p>

For detailed development guidelines, see **[CLAUDE.md](./CLAUDE.md)**.

## Quick Start

```bash
# Use Node.js v24.4.1
nvm use  # or fnm use

# Enable pnpm
corepack enable

# Install dependencies
pnpm install --frozen-lockfile --ignore-scripts
```

## Key Technologies

- **Build System:** Nx 22.3.3
- **Package Manager:** pnpm
- **Frontend:** React 18.3.1, Angular 21.0.6
- **Backend:** NestJS 11.0.0, Express 5.0.0
- **Database:** PostgreSQL with TypeORM
- **GraphQL:** Apollo Server/Client
- **Testing:** Vitest, Jest, Playwright

## Common Commands

```bash
# Serve applications
pnpm nx serve soccer-stats-ui    # Full stack soccer stats (starts API too)
pnpm nx serve chore-board-ui     # Chore board app
pnpm nx serve ng-example         # Angular example

# Build, test, and lint
pnpm nx build <project-name>
pnpm nx test <project-name>
pnpm nx lint <project-name>

# Run affected commands
pnpm nx affected -t test
pnpm nx affected -t build
pnpm nx affected -t lint
```

## Project Structure

```
apps/
├── soccer-stats/          # Primary app: Soccer statistics tracker
├── chore-board/           # Kanban-style chore tracking
├── auth/api/              # Authentication services
├── campsite-watcher/      # Campsite availability monitoring
└── ng/example/            # Angular example app

libs/
├── soccer-stats/          # Soccer stats shared libraries
├── campsite-watcher/      # Campsite watcher libraries
├── ng/lib-example/        # Angular shared components
└── wordle/core/           # Wordle game logic
```

## Visualize the Workspace

```bash
pnpm nx graph
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guidelines
- **[Nx Documentation](https://nx.dev)** - Nx framework docs

## Nx Cloud

This workspace uses Nx Cloud for distributed caching. Visit [Nx Cloud](https://nx.app/) to learn more.
