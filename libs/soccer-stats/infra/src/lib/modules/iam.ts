import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface IamOutputs {
  taskExecutionRole: aws.iam.Role;
  taskRole: aws.iam.Role;
  taskExecutionRoleArn: aws.iam.Role['arn'];
  taskRoleArn: aws.iam.Role['arn'];
}

/**
 * Creates IAM roles for ECS task execution and task runtime.
 */
export function createIamRoles(config: IamConfig): IamOutputs {
  const { namePrefix, stack, awsProvider } = config;

  // Task execution role - used by ECS to pull images and write logs
  const taskExecutionRole = new aws.iam.Role(
    `${namePrefix}-task-exec-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-task-exec-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-task-exec-policy`,
    {
      role: taskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    },
    { provider: awsProvider },
  );

  // Task role - used by the running container for AWS API calls
  const taskRole = new aws.iam.Role(
    `${namePrefix}-task-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-task-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    taskExecutionRole,
    taskRole,
    taskExecutionRoleArn: taskExecutionRole.arn,
    taskRoleArn: taskRole.arn,
  };
}

/**
 * Grants the task execution role permission to read a Secrets Manager secret.
 */
export function grantSecretAccess(
  namePrefix: string,
  taskExecutionRole: aws.iam.Role,
  secretArn: pulumi.Output<string>,
  awsProvider: aws.Provider,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _secretAccessPolicy = new aws.iam.RolePolicy(
    `${namePrefix}-secret-access`,
    {
      role: taskExecutionRole.name,
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
