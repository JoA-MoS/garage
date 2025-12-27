import { Injectable } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';

import { getClerkSecretKey, getClerkJwtAudience } from '../../app/environment';

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string; id: string }>;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
}

/**
 * Actor information present in JWT during Clerk impersonation sessions.
 * @see https://clerk.com/docs/guides/users/impersonation
 */
export interface ClerkActor {
  /** User ID of the impersonator (admin performing the impersonation) */
  sub: string;
  /** Session ID of the impersonator */
  sid?: string;
  /** Issuer (typically https://dashboard.clerk.com) */
  iss?: string;
}

/**
 * JWT payload structure from Clerk authentication.
 */
export interface ClerkPayload {
  /** User ID of the authenticated (or impersonated) user */
  sub: string;
  /** Session ID */
  sid?: string;
  /** Actor claim - only present during impersonation sessions */
  act?: ClerkActor;
  /** Additional claims */
  [key: string]: unknown;
}

@Injectable()
export class ClerkService {
  private clerkClient;

  constructor() {
    this.clerkClient = createClerkClient({
      secretKey: getClerkSecretKey(),
    });
  }

  async verifyToken(token: string): Promise<ClerkPayload> {
    try {
      const payload = await verifyToken(token, {
        secretKey: getClerkSecretKey() as string,
        audience: getClerkJwtAudience(),
      });
      return payload as ClerkPayload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  async getUser(userId: string): Promise<ClerkUser> {
    try {
      const user = await this.clerkClient.users.getUser(userId);
      return {
        id: user.id,
        emailAddresses: user.emailAddresses,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        username: user.username ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  async getUserFromToken(token: string): Promise<ClerkUser> {
    const payload = await this.verifyToken(token);
    return this.getUser(payload.sub);
  }
}
