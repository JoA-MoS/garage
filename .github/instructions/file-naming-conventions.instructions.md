---
applyTo: '**'
---

# File Naming Conventions

Follow these naming conventions consistently across all projects in the workspace.

## General Rules

- Use **PascalCase** for React components, classes, and TypeScript interfaces
- Use **camelCase** for variables, functions, and object properties
- Use **kebab-case** for all file names including React components
- Use **dot notation** to separate name and type (e.g., `game-header.smart.tsx`)
- Use **SCREAMING_SNAKE_CASE** for constants and environment variables

## File Extensions

- `.tsx` for React components with JSX
- `.ts` for TypeScript files without JSX
- `.js` for JavaScript files (avoid in new code)
- `.json` for configuration and data files
- `.md` for documentation
- `.spec.ts` or `.test.ts` for test files
- `.stories.ts` for Storybook stories

## Directory Structure Patterns

### React Applications

```
src/
├── app/
│   ├── components/
│   │   ├── smart/              # Smart components
│   │   │   ├── game-manager.smart.tsx
│   │   │   └── player-list.smart.tsx
│   │   ├── presentation/       # Presentation components
│   │   │   ├── game-header.presentation.tsx
│   │   │   └── player-card.presentation.tsx
│   │   └── common/            # Shared/utility components
│   │   │   ├── button.tsx
│   │   │   └── modal.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-game-manager.ts
│   │   └── use-player-data.ts
│   ├── services/              # API and external services
│   │   ├── api/
│   │   │   ├── game-api.ts
│   │   │   └── player-api.ts
│   │   └── utils/
│   ├── types/                 # TypeScript type definitions
│   │   ├── game.types.ts
│   │   └── player.types.ts
│   └── constants/             # Application constants
├── assets/                    # Static assets
└── styles/                    # Global styles
```

### Node.js/API Applications

```
src/
├── app/
│   ├── controllers/           # Request handlers
│   │   ├── game.controller.ts
│   │   └── player.controller.ts
│   ├── services/              # Business logic
│   │   ├── game.service.ts
│   │   └── player.service.ts
│   ├── repositories/          # Data access layer
│   │   ├── game.repository.ts
│   │   └── player.repository.ts
│   ├── entities/              # Database entities
│   │   ├── game.entity.ts
│   │   └── player.entity.ts
│   ├── dto/                   # Data transfer objects
│   │   ├── create-game.dto.ts
│   │   └── update-player.dto.ts
│   ├── middleware/            # Express middleware
│   ├── routes/                # Route definitions
│   └── utils/                 # Utility functions
├── database/                  # Database migrations and seeds
└── config/                    # Configuration files
```

## Specific Naming Patterns

### React Components

**Smart Components:**

- `{feature-name}.smart.tsx` (e.g., `game-header.smart.tsx`)
- Handle data and business logic
- Located in `components/smart/`

**Presentation Components:**

- `{feature-name}.presentation.tsx` (e.g., `game-header.presentation.tsx`)
- Pure UI components
- Located in `components/presentation/`

**Common/Shared Components:**

- `{component-name}.tsx` (e.g., `button.tsx`, `modal.tsx`)
- Reusable across the application
- Located in `components/common/`

### Custom Hooks

- `use-{hook-name}.ts` (e.g., `use-game-manager.ts`, `use-api-call.ts`)
- Start with "use-" prefix
- Located in `hooks/`

### Services and APIs

- `{domain}-api.ts` (e.g., `game-api.ts`, `player-api.ts`)
- `{domain}.service.ts` (e.g., `game.service.ts`)
- Use kebab-case for multi-word domains

### Types and Interfaces

- `{domain}.types.ts` (e.g., `game.types.ts`, `api.types.ts`)
- Interface names: `{Name}Interface` or just `{Name}` (e.g., `Game`, `Player`)
- Type names: `{Name}Type` (e.g., `GameStatusType`)

### Constants

- `{domain}.constants.ts` (e.g., `game.constants.ts`)
- Constant values: `SCREAMING_SNAKE_CASE` (e.g., `MAX_PLAYERS`, `DEFAULT_TIMEOUT`)

### Test Files

- `{filename}.spec.ts` for unit tests
- `{filename}.test.ts` for integration tests
- `{filename}.e2e-spec.ts` for end-to-end tests
- Place test files next to the files they test

### Configuration Files

- `{service}.config.ts` (e.g., `database.config.ts`, `auth.config.ts`)
- Environment files: `.env`, `.env.local`, `.env.development`
- Use kebab-case for multi-word config files

## Documentation Files

### Required Documentation Files

- `README.md` - Project overview and setup instructions
- `ARCHITECTURE.md` - Architecture decisions and patterns
- `CHANGELOG.md` - Version history and changes
- `CONTRIBUTING.md` - Contribution guidelines

### Optional Documentation Files

- `MIGRATION.md` - Migration guides for breaking changes
- `REFACTORING_SUMMARY.md` - Summary of major refactoring work
- `DEPLOYMENT.md` - Deployment instructions

## Examples

### Good Examples

```
✅ game-header.smart.tsx
✅ player-card.presentation.tsx
✅ use-game-manager.ts
✅ game-api.service.ts
✅ player.types.ts
✅ GAME_STATUS.constants.ts
✅ game-header.spec.ts
```

### Bad Examples

```
❌ gameheader.tsx (should be kebab-case)
❌ GameHeaderContainer.tsx (use ".smart.tsx" suffix instead)
❌ gameApi.ts (should be kebab-case)
❌ PlayerTypes.ts (should be lowercase with domain)
❌ gameConstants.ts (should be SCREAMING_SNAKE_CASE for constants)
```

## Migration Guidelines

When renaming existing files:

1. Create the new file with the correct name
2. Copy content and update imports
3. Update all references in other files
4. Delete the old file
5. Update tests and documentation
6. Run tests to ensure nothing is broken
