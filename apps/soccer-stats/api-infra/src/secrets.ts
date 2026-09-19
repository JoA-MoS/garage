import * as aws from '@pulumi/aws';

import { namePrefix, stack, clerkSecretKey } from './config';
import { ecsTaskExecutionRoleArn } from './shared-infra';

// Store Clerk secret key as a plain string (not JSON) so ECS can inject it directly
export const clerkSecretKeySecret = new aws.secretsmanager.Secret(
  `${namePrefix}-clerk-secret-key`,
  {
    name: `soccer-stats-${stack}/clerk-secret-key`,
    description:
      'Clerk secret key for soccer-stats API (plain string for ECS task definition)',
    tags: { Name: `${namePrefix}-clerk-secret-key`, Environment: stack },
  },
);

export const clerkSecretKeySecretVersion = new aws.secretsmanager.SecretVersion(
  `${namePrefix}-clerk-secret-key-version`,
  {
    secretId: clerkSecretKeySecret.id,
    secretString: clerkSecretKey,
  },
);

// Grant the ECS execution role access to the Clerk secret — it's the
// execution role that resolves `secrets` referenced in the task definition.
export const clerkSecretPolicy = new aws.iam.RolePolicy(
  `${namePrefix}-clerk-secret-policy`,
  {
    role: ecsTaskExecutionRoleArn.apply((arn) => arn.split('/').pop()!),
    policy: clerkSecretKeySecret.arn.apply((secretArn) =>
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

export const clerkSecretKeySecretArn = clerkSecretKeySecret.arn;
