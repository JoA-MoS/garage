import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import {
  ClerkActor,
  ClerkPayload as ClerkPayloadType,
  ClerkUser,
} from './clerk.service';

/**
 * Parameter decorator to get the current authenticated user.
 * Returns the impersonated user during impersonation sessions.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): ClerkUser => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.user;
  }
);

/**
 * Parameter decorator to get the full Clerk JWT payload.
 */
export const ClerkPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext): ClerkPayloadType => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.clerkPayload;
  }
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
  }
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
  }
);
