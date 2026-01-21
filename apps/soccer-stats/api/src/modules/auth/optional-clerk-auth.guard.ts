import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { UsersService } from '../users/users.service';

import { ClerkActor, ClerkService } from './clerk.service';
import { AuthenticatedUser } from './authenticated-user.type';

/**
 * Optional authentication guard for Clerk.
 *
 * Unlike ClerkAuthGuard which throws on missing/invalid tokens,
 * this guard:
 * - Sets req.user (as AuthenticatedUser) if a valid token is present
 * - Continues without error if no token or invalid token
 *
 * Use this for endpoints that have different behavior for
 * authenticated vs anonymous users (like the `my` query).
 */
@Injectable()
export class OptionalClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalClerkAuthGuard.name);

  constructor(
    private clerkService: ClerkService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

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
      const clerkUser = await this.clerkService.getUser(payload.sub);

      // Look up or create internal user (JIT provisioning)
      // This is the single point where Clerk ID is mapped to internal user
      const internalUser =
        await this.usersService.findOrCreateByClerkUser(clerkUser);

      // Create unified AuthenticatedUser with both Clerk and internal info
      const authenticatedUser: AuthenticatedUser = {
        id: internalUser.id,
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress ?? '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        internal: internalUser,
      };

      // Extract actor (impersonation) information
      const actor: ClerkActor | null = payload.act ?? null;
      const isImpersonating = !!actor;

      // Log impersonation for audit purposes
      if (isImpersonating) {
        this.logger.log(
          `Impersonation session: Admin ${actor.sub} acting as user ${internalUser.id} (${internalUser.firstName} ${internalUser.lastName})`,
        );
      }

      // Attach authenticated user and impersonation context to the request
      req.user = authenticatedUser;
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
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    // Always allow - req.user will be set if authenticated, undefined otherwise
    return true;
  }
}
