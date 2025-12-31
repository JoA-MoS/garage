import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { ClerkActor, ClerkService } from './clerk.service';

/**
 * Optional authentication guard for Clerk.
 *
 * Unlike ClerkAuthGuard which throws on missing/invalid tokens,
 * this guard:
 * - Sets req.user if a valid token is present
 * - Continues without error if no token or invalid token
 *
 * Use this for endpoints that have different behavior for
 * authenticated vs anonymous users (like the `my` query).
 */
@Injectable()
export class OptionalClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalClerkAuthGuard.name);

  constructor(private clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    // No request object (e.g., WebSocket subscription without HTTP upgrade)
    if (!req) {
      return true;
    }

    const authHeader = req.headers?.authorization;
    if (!authHeader) {
      // No auth header - continue as anonymous
      return true;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      // Empty token - continue as anonymous
      return true;
    }

    try {
      const payload = await this.clerkService.verifyToken(token);
      const user = await this.clerkService.getUser(payload.sub);

      // Extract actor (impersonation) information
      const actor: ClerkActor | null = payload.act ?? null;
      const isImpersonating = !!actor;

      // Log impersonation for audit purposes
      if (isImpersonating) {
        this.logger.log(
          `Impersonation session: Admin ${actor.sub} acting as user ${user.id} (${user.firstName} ${user.lastName})`
        );
      }

      // Attach user and impersonation context to the request
      req.user = user;
      req.clerkPayload = payload;
      req.actor = actor;
      req.isImpersonating = isImpersonating;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Distinguish between token issues (expected) and system errors (unexpected)
      const isTokenError =
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('jwt') ||
        errorMessage.includes('malformed') ||
        errorMessage.includes('signature');

      if (isTokenError) {
        // Token issues are expected - user needs to re-authenticate
        this.logger.warn(`Optional auth failed (token issue): ${errorMessage}`);
      } else {
        // System errors (network, Clerk API down, etc.) - log with stack for debugging
        this.logger.error(
          `Optional auth failed (system error): ${errorMessage}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }

    // Always allow - req.user will be set if authenticated, undefined otherwise
    return true;
  }
}
