import * as aws from '@pulumi/aws';

export interface LoggingConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface LoggingOutputs {
  logGroup: aws.cloudwatch.LogGroup;
  logGroupName: aws.cloudwatch.LogGroup['name'];
  logGroupArn: aws.cloudwatch.LogGroup['arn'];
}

/**
 * Creates CloudWatch log group for ECS task logs.
 */
export function createLogGroup(config: LoggingConfig): LoggingOutputs {
  const { namePrefix, stack, awsProvider } = config;

  const logGroup = new aws.cloudwatch.LogGroup(
    `${namePrefix}-logs`,
    {
      name: `/ecs/${namePrefix}`,
      retentionInDays: stack === 'prod' ? 30 : 7,
      tags: { Name: `${namePrefix}-logs`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    logGroup,
    logGroupName: logGroup.name,
    logGroupArn: logGroup.arn,
  };
}
