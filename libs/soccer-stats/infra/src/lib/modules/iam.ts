import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface IamOutputs {
  appRunnerAccessRole: aws.iam.Role;
  appRunnerInstanceRole: aws.iam.Role;
  appRunnerAccessRoleArn: pulumi.Output<string>;
  appRunnerInstanceRoleArn: pulumi.Output<string>;
}

/** Creates IAM roles for App Runner image pull (access role) and runtime (instance role). */
export function createIamRoles(config: IamConfig): IamOutputs {
  const { namePrefix, stack, awsProvider } = config;

  // Access role — used by App Runner build service to pull images from ECR
  const appRunnerAccessRole = new aws.iam.Role(
    `${namePrefix}-apprunner-access-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'build.apprunner.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-apprunner-access-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-apprunner-ecr-policy`,
    {
      role: appRunnerAccessRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess',
    },
    { provider: awsProvider },
  );

  // Instance role — used by the running container to call AWS APIs
  const appRunnerInstanceRole = new aws.iam.Role(
    `${namePrefix}-apprunner-instance-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'tasks.apprunner.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Name: `${namePrefix}-apprunner-instance-role`,
        Environment: stack,
      },
    },
    { provider: awsProvider },
  );

  return {
    appRunnerAccessRole,
    appRunnerInstanceRole,
    appRunnerAccessRoleArn: appRunnerAccessRole.arn,
    appRunnerInstanceRoleArn: appRunnerInstanceRole.arn,
  };
}

/**
 * Grants the App Runner instance role permission to read a Secrets Manager secret.
 * Call once per secret that the running container needs to access.
 */
export function grantSecretAccess(
  namePrefix: string,
  instanceRole: aws.iam.Role,
  secretArn: pulumi.Output<string>,
  awsProvider: aws.Provider,
  suffix: string,
): void {
  new aws.iam.RolePolicy(
    `${namePrefix}-secret-access-${suffix}`,
    {
      role: instanceRole.name,
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
