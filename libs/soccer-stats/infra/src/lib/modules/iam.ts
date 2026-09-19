import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface IamOutputs {
  ecsTaskExecutionRole: aws.iam.Role;
  ecsTaskRole: aws.iam.Role;
  ecsTaskExecutionRoleArn: pulumi.Output<string>;
  ecsTaskRoleArn: pulumi.Output<string>;
}

/**
 * Creates IAM roles for ECS Fargate: the execution role (used by the ECS
 * agent to pull the image, write logs, and resolve `secrets` referenced in
 * the container definition) and the task role (assumed by the running
 * container itself for any AWS API calls it makes at runtime).
 */
export function createIamRoles(config: IamConfig): IamOutputs {
  const { namePrefix, stack, awsProvider } = config;

  const assumeRolePolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: { Service: 'ecs-tasks.amazonaws.com' },
        Effect: 'Allow',
      },
    ],
  });

  // Execution role — used by the ECS agent (not the app) to pull the image
  // from ECR, write container logs to CloudWatch, and fetch `secrets`
  // referenced in the container definition.
  const ecsTaskExecutionRole = new aws.iam.Role(
    `${namePrefix}-ecs-execution-role`,
    {
      assumeRolePolicy,
      tags: { Name: `${namePrefix}-ecs-execution-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-ecs-execution-policy`,
    {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    },
    { provider: awsProvider },
  );

  // Task role — assumed by the running container for any AWS API calls it
  // makes itself. Starts with no extra permissions beyond the trust policy;
  // grant specific access (e.g. via grantSecretAccess) as needed.
  const ecsTaskRole = new aws.iam.Role(
    `${namePrefix}-ecs-task-role`,
    {
      assumeRolePolicy,
      tags: {
        Name: `${namePrefix}-ecs-task-role`,
        Environment: stack,
      },
    },
    { provider: awsProvider },
  );

  return {
    ecsTaskExecutionRole,
    ecsTaskRole,
    ecsTaskExecutionRoleArn: ecsTaskExecutionRole.arn,
    ecsTaskRoleArn: ecsTaskRole.arn,
  };
}

/**
 * Grants a role permission to read a Secrets Manager secret.
 * Call once per secret that role needs access to. For ECS Fargate, secrets
 * referenced in a container definition's `secrets` field are resolved by
 * the *execution* role, not the task role.
 */
export function grantSecretAccess(
  namePrefix: string,
  role: aws.iam.Role,
  secretArn: pulumi.Output<string>,
  awsProvider: aws.Provider,
  suffix: string,
): void {
  new aws.iam.RolePolicy(
    `${namePrefix}-secret-access-${suffix}`,
    {
      role: role.name,
      policy: secretArn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: [arn],
            },
          ],
        }),
      ),
    },
    { provider: awsProvider },
  );
}
