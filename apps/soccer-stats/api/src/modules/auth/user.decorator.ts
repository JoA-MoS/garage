import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { ClerkActor, ClerkPayload as ClerkPayloadType } from './clerk.service';
import { AuthenticatedUser } from './authenticated-user.type';

/**
 * Parameter decorator to get the current authenticated user.
 *
 * Returns an AuthenticatedUser object that includes:
 * - `id`: Internal user ID (UUID) - use this for all domain operations
 * - `clerkId`: Clerk user ID - only for Clerk-specific operations
 * - `email`, `firstName`, `lastName`: User profile data
 * - `internal`: Full internal User entity
 *
 * The internal user lookup happens once in the auth guard, so resolvers
 * can access the internal user ID directly without additional DB queries.
 *
 * @example
 * ```typescript
 * @Mutation(() => Team)
 * @UseGuards(ClerkAuthGuard)
 * async createTeam(
 *   @Args('input') input: CreateTeamInput,
 *   @CurrentUser() user: AuthenticatedUser,
 * ) {
 *   // Use user.id (internal UUID) for domain operations
 *   return this.teamsService.create(input, user.id);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthenticatedUser | null => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.user ?? null;
  },
);

/**
 * Parameter decorator to get the full Clerk JWT payload.
 */
export const ClerkPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext): ClerkPayloadType => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.clerkPayload;
  },
);

/**
 * Parameter decorator to get the actor (impersonator) information.
 * Returns null if not an impersonation session.
 * @see https://clerk.com/docs/guides/users/impersonation
 */
export const Actor = createParamDecorator(
  (data: unknown, context: ExecutionContext): ClerkActor | null => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.actor ?? null;
  },
);

/**
 * Parameter decorator to check if the current session is an impersonation.
 * Returns true if an admin is impersonating another user.
 */
export const IsImpersonating = createParamDecorator(
  (data: unknown, context: ExecutionContext): boolean => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.isImpersonating ?? false;
  },
);
