import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import {
  namePrefix,
  stack,
  clerkSecretKey,
  clerkPublishableKey,
} from './config';
import { taskExecutionRoleArn } from './shared-infra';

// =============================================================================
// Clerk Secrets
// =============================================================================
// Store Clerk credentials in Secrets Manager for secure access by ECS
export const clerkSecret = new aws.secretsmanager.Secret(
  `${namePrefix}-clerk`,
  {
    name: `soccer-stats-${stack}/clerk`,
    description: 'Clerk authentication credentials for soccer-stats API',
    tags: {
      Name: `${namePrefix}-clerk`,
      Environment: stack,
    },
  },
);

export const clerkSecretVersion = new aws.secretsmanager.SecretVersion(
  `${namePrefix}-clerk-version`,
  {
    secretId: clerkSecret.id,
    secretString: pulumi
      .all([clerkSecretKey, clerkPublishableKey])
      .apply(([secretKey, publishableKey]) =>
        JSON.stringify({
          secretKey,
          publishableKey,
        }),
      ),
  },
);

// Grant task execution role access to the Clerk secret
export const clerkSecretPolicy = new aws.iam.RolePolicy(
  `${namePrefix}-clerk-secret-policy`,
  {
    role: taskExecutionRoleArn.apply((arn: string) => arn.split('/').pop()!),
    policy: clerkSecret.arn.apply((secretArn) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: secretArn,
          },
        ],
      }),
    ),
  },
);
