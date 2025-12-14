# Backend Authentication with Clerk

This document explains the Clerk authentication implementation for the soccer-stats-api NestJS GraphQL service.

## Overview

The soccer-stats-api now uses Clerk for backend authentication, providing JWT token verification and user context for GraphQL operations.

## Architecture

### Authentication Module (`src/modules/auth/`)

The authentication module consists of:

1. **ClerkService** (`clerk.service.ts`) - Core service for JWT verification and user management
2. **ClerkAuthGuard** (`clerk-auth.guard.ts`) - NestJS guard for protecting GraphQL endpoints
3. **Public Decorator** (`public.decorator.ts`) - Decorator for marking routes as public
4. **User Decorators** (`user.decorator.ts`) - Parameter decorators for extracting user data
5. **AuthModule** (`auth.module.ts`) - Module configuration

### Key Components

#### ClerkService

```typescript
export class ClerkService {
  async verifyToken(token: string): Promise<{ sub: string; [key: string]: unknown }>;
  async getUser(userId: string): Promise<ClerkUser>;
  async getUserFromToken(token: string): Promise<ClerkUser>;
}
```

Handles:

- JWT token verification using Clerk's `verifyToken` function
- User data retrieval from Clerk API
- User context extraction from JWT tokens

#### ClerkAuthGuard

```typescript
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean>;
}
```

Features:

- Protects GraphQL endpoints by default
- Supports public routes via `@Public()` decorator
- Extracts and verifies JWT tokens from Authorization header
- Injects user context into GraphQL request object

#### User Decorators

```typescript
export const CurrentUser = createParamDecorator(/* ... */);
export const ClerkPayload = createParamDecorator(/* ... */);
```

Enables easy access to user data in resolvers:

- `@CurrentUser()` - Get complete user object
- `@ClerkPayload()` - Get JWT payload data

## Usage

### Environment Configuration

Required environment variables:

```bash
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_JWT_AUDIENCE=your_clerk_audience_here
```

### Protecting Resolvers

#### Apply Guard to Entire Resolver

```typescript
@Resolver(() => Game)
@UseGuards(ClerkAuthGuard)
export class GamesResolver {
  // All methods require authentication by default
}
```

#### Public Routes

```typescript
@Query(() => [Game])
@Public() // This endpoint is publicly accessible
findAll() {
  return this.gamesService.findAll();
}
```

#### Protected Mutations with User Context

```typescript
@Mutation(() => Game)
async createGame(
  @Args('createGameInput') createGameInput: CreateGameInput,
  @CurrentUser() user: ClerkUser
) {
  console.log('Creating game for user:', user.id);
  return this.gamesService.create(createGameInput);
}
```

### GraphQL Context

The app module is configured to inject user data into GraphQL context:

```typescript
context: ({ req }: { req: AuthenticatedRequest }) => {
  return { req, user: req.user, clerkPayload: req.clerkPayload };
};
```

## Authentication Flow

1. Client sends GraphQL request with JWT token in Authorization header
2. ClerkAuthGuard intercepts the request
3. Guard extracts token and verifies it with Clerk
4. If valid, user data is fetched and injected into request object
5. Resolver can access user via `@CurrentUser()` decorator
6. If invalid or missing (and not public), request is rejected

## Security Features

- JWT signature verification using Clerk's secret key
- Audience validation for token scope
- Automatic user context injection
- Public route support for non-authenticated endpoints
- Type-safe user data access

## Error Handling

- Invalid tokens return 401 Unauthorized
- Missing tokens on protected routes return 401 Unauthorized
- Clerk API errors are logged and return appropriate HTTP status codes
- Public routes bypass authentication entirely

## Current Implementation Status

✅ **Completed:**

- Authentication module structure
- Clerk service with JWT verification
- Authentication guard with public route support
- User parameter decorators
- GraphQL context configuration
- Games resolver protection with user context

🔄 **Next Steps:**

- Apply authentication to Teams and Players resolvers
- Add user-based data filtering (show only user's data)
- Implement role-based authorization if needed
- Add integration tests for authentication flows

## Dependencies

- `@clerk/backend` - Clerk backend SDK for JWT verification
- `@nestjs/common` - NestJS decorators and guards
- `@nestjs/graphql` - GraphQL integration
- `express` - Request typing

## Testing

The authentication implementation passes all existing tests and linting rules. To test authentication:

1. Ensure Clerk environment variables are set
2. Start the server: `pnpm nx serve soccer-stats-api`
3. Send GraphQL requests with valid Clerk JWT tokens
4. Verify protected mutations require authentication
5. Verify public queries work without tokens
