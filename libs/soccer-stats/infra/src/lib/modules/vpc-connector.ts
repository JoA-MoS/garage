import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcConnectorConfig {
  namePrefix: string;
  stack: string;
  privateSubnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface VpcConnectorOutputs {
  vpcConnector: aws.apprunner.VpcConnector;
  vpcConnectorArn: pulumi.Output<string>;
}

/** Creates an App Runner VPC Connector so the service can reach Aurora in private subnets. */
export function createVpcConnector(
  config: VpcConnectorConfig,
): VpcConnectorOutputs {
  const { namePrefix, stack, privateSubnetIds, securityGroupId, awsProvider } =
    config;

  const vpcConnector = new aws.apprunner.VpcConnector(
    `${namePrefix}-vpc-connector`,
    {
      vpcConnectorName: `${namePrefix}-connector`,
      subnets: privateSubnetIds,
      securityGroups: [securityGroupId],
      tags: { Name: `${namePrefix}-vpc-connector`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    vpcConnector,
    vpcConnectorArn: vpcConnector.arn,
  };
}
