import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';

import { UsersService } from '../users/users.service';

import { ClerkActor, ClerkService } from './clerk.service';
import { AuthenticatedUser } from './authenticated-user.type';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private clerkService: ClerkService,
    private reflector: Reflector,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token missing');
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

      return true;
    } catch (error) {
      // Log the actual error for debugging but return generic message
      this.logger.error(
        'Authentication failed',
        error instanceof Error ? error.message : String(error),
      );
      throw new UnauthorizedException('Invalid token');
    }
  }
}
