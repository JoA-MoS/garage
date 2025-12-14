import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { ClerkUser } from './clerk.service';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): ClerkUser => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.user;
  }
);

export const ClerkPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.clerkPayload;
  }
);
