# soccer-stats-graphql-codegen

Shared library containing GraphQL type generation for the Soccer Stats application.

## Purpose

This library provides centralized GraphQL type generation using [GraphQL Code Generator](https://the-guild.dev/graphql/codegen). It introspects the `soccer-stats-api` GraphQL schema and generates type-safe TypeScript types and utilities that can be consumed by client applications.

## Features

- **Automatic API Startup**: The codegen targets automatically start the API server when running
- **Wait-for-Ready**: Health checks ensure the API is ready before schema introspection
- **Type-Safe GraphQL**: Uses The Guild's fragment masking pattern for type safety
- **Watch Mode**: Continuous regeneration during development
- **Reusable**: Generated types can be shared across multiple applications

## Usage

### Running Code Generation

Generate types once:

```bash
nx codegen soccer-stats-graphql-codegen
```

Generate types with watch mode (continuous):

```bash
nx codegen-watch soccer-stats-graphql-codegen
```

Both commands will:
1. Automatically start the `soccer-stats-api` server
2. Wait for the API to be ready at `http://localhost:3333/api/graphql`
3. Introspect the GraphQL schema
4. Generate TypeScript types in `src/generated/`

### Importing Generated Types

Import the generated types and utilities in your application:

```typescript
import { graphql } from '@garage/soccer-stats/graphql-codegen';
import { FragmentType, useFragment } from '@garage/soccer-stats/graphql-codegen';
```

### Using Fragment Masking Pattern

The library follows The Guild's recommended fragment masking pattern for type-safe GraphQL:

```typescript
// Define a fragment in your smart component
import { graphql } from '@garage/soccer-stats/graphql-codegen';
import { FragmentType, useFragment } from '@garage/soccer-stats/graphql-codegen';

export const GameCardFragment = graphql(/* GraphQL */ `
  fragment GameCard on Game {
    id
    date
    homeTeam {
      id
      name
    }
    awayTeam {
      id
      name
    }
  }
`);

// Use the fragment in your component
interface GameCardProps {
  game: FragmentType<typeof GameCardFragment>;
}

export const GameCard = ({ game: gameFragment }: GameCardProps) => {
  const game = useFragment(GameCardFragment, gameFragment);
  
  return (
    <div>
      <h2>{game.homeTeam.name} vs {game.awayTeam.name}</h2>
      <p>{game.date}</p>
    </div>
  );
};
```

### Spreading Fragments in Queries

Spread fragments in your queries for optimal type safety:

```typescript
import { useQuery } from '@apollo/client';
import { graphql } from '@garage/soccer-stats/graphql-codegen';
import { GameCard, GameCardFragment } from './game-card';

const GetGamesQuery = graphql(/* GraphQL */ `
  query GetGames {
    games {
      id
      ...GameCard
    }
  }
`);

export const GamesList = () => {
  const { data } = useQuery(GetGamesQuery);
  
  return (
    <div>
      {data?.games?.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
};
```

## Generated Files

The library generates the following files in `src/generated/`:

- `gql.ts` - GraphQL tag function and document definitions
- `graphql.ts` - Generated TypeScript types for all GraphQL operations
- `fragment-masking.ts` - Fragment masking utilities (`FragmentType`, `useFragment`)
- `index.ts` - Re-exports all generated types and utilities

## Configuration

GraphQL Code Generator configuration is defined in `codegen.ts` at the library root.

### Schema Source

The library introspects the schema from the running API server at:
- **URL**: `http://localhost:3333/api/graphql`
- **Server**: `soccer-stats-api`

### Client Preset

Uses the `client` preset from `@graphql-codegen/client-preset` which provides:
- Optimized type generation for Apollo Client
- Fragment masking for type safety
- Automatic operation type generation

## Dependencies

This library depends on:
- `soccer-stats-api` - Must be running for schema introspection
- `@graphql-codegen/cli` - Code generation tool
- `@graphql-codegen/client-preset` - Client-optimized preset

## Development Workflow

When developing with the UI application:

```bash
nx serve soccer-stats-ui
```

This command will:
1. Start the API server (`soccer-stats-api:serve`)
2. Start codegen in watch mode (`soccer-stats-graphql-codegen:codegen-watch`)
3. Start the UI development server

The codegen will automatically regenerate types whenever you modify GraphQL operations in your code.

## Troubleshooting

### API Not Starting

If the health check fails, ensure:
- Port 3333 is not in use
- Database is accessible
- Environment variables are properly configured

### Schema Not Found

If schema introspection fails:
- Verify the API is running at `http://localhost:3333`
- Check that GraphQL introspection is enabled
- Ensure the `/api/graphql` endpoint is accessible

### Type Errors After Regeneration

If you encounter type errors after regenerating:
1. Restart your TypeScript language server
2. Clear your IDE's cache
3. Verify all fragments are properly imported and used
