import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';

import { ClerkActor, ClerkService } from './clerk.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private clerkService: ClerkService,
    private reflector: Reflector
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

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
