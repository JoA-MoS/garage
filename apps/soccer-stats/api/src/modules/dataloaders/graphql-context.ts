import { Request } from 'express';

import { ClerkActor, ClerkPayload, ClerkUser } from '../auth/clerk.service';

import { IDataLoaders } from './dataloaders.service';

/**
 * Type definition for the GraphQL context object.
 * This includes authentication info and DataLoaders.
 */
export interface GraphQLContext {
  req: Request | null;
  user: ClerkUser | null;
  clerkPayload: ClerkPayload | null;
  actor: ClerkActor | null;
  isImpersonating: boolean;
  loaders: IDataLoaders;
  extra?: unknown;
}
