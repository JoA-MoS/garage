import { Injectable } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';

import { getClerkSecretKey } from '../../app/environment';

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
  private readonly clerkClient;
  private readonly secretKey: string;

  constructor() {
    const secretKey = getClerkSecretKey();
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY environment variable is not set');
    }

    this.secretKey = secretKey;
    this.clerkClient = createClerkClient({ secretKey });
  }

  /**
   * Verifies a Clerk JWT token and returns the payload.
   * Clerk handles JWT verification using JWKS (JSON Web Key Set) -
   * it fetches public keys from Clerk's servers to verify the signature.
   */
  async verifyToken(token: string): Promise<ClerkPayload> {
    try {
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
      });
      return payload as ClerkPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const wrappedError = new Error(`Token verification failed: ${message}`);
      // Preserve original error for debugging (ES2022 Error.cause pattern via Object.assign)
      if (error instanceof Error) {
        Object.assign(wrappedError, { cause: error });
      }
      throw wrappedError;
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
      const message = error instanceof Error ? error.message : String(error);
      const wrappedError = new Error(`Failed to get user: ${message}`);
      // Preserve original error for debugging (ES2022 Error.cause pattern via Object.assign)
      if (error instanceof Error) {
        Object.assign(wrappedError, { cause: error });
      }
      throw wrappedError;
    }
  }

  async getUserFromToken(token: string): Promise<ClerkUser> {
    const payload = await this.verifyToken(token);
    return this.getUser(payload.sub);
  }
}
