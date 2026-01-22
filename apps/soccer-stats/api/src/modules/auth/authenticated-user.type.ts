import { User } from '../../entities/user.entity';

/**
 * Represents the authenticated user context available to resolvers.
 *
 * This type combines Clerk authentication data with the internal user record,
 * allowing resolvers to access the internal user ID directly without
 * additional database lookups.
 *
 * Architecture principle: The Clerk ID should only be used in the auth layer.
 * All domain logic should use the internal user ID.
 */
export interface AuthenticatedUser {
  /** Internal user ID (UUID) - use this for all domain operations */
  id: string;

  /** Clerk user ID - only needed for Clerk-specific operations */
  clerkId: string;

  /** User's primary email address */
  email: string;

  /** User's first name */
  firstName?: string;

  /** User's last name */
  lastName?: string;

  /** Clerk profile image URL */
  imageUrl?: string;

  /** The full internal User entity (lazy-loaded if needed) */
  internal: User;
}
