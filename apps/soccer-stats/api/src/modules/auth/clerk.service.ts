import { Injectable } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string; id: string }>;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
}

@Injectable()
export class ClerkService {
  private clerkClient;

  constructor() {
    this.clerkClient = createClerkClient({
      secretKey: process.env['CLERK_SECRET_KEY'],
    });
  }

  async verifyToken(
    token: string
  ): Promise<{ sub: string; [key: string]: unknown }> {
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env['CLERK_SECRET_KEY'] as string,
        audience: process.env['CLERK_JWT_AUDIENCE'],
      });
      return payload;
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
