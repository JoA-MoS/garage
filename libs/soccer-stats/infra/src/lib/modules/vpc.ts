import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

export interface VpcConfig {
  namePrefix: string;
  stack: string;
  vpcCidr: string;
  azCount: number;
  enableNatGateway: boolean;
  awsProvider: aws.Provider;
}

export interface VpcOutputs {
  vpc: awsx.ec2.Vpc;
  vpcId: awsx.ec2.Vpc['vpcId'];
  publicSubnetIds: awsx.ec2.Vpc['publicSubnetIds'];
  privateSubnetIds: awsx.ec2.Vpc['privateSubnetIds'];
}

/**
 * Creates the VPC with public and private subnets.
 */
export function createVpc(config: VpcConfig): VpcOutputs {
  const { namePrefix, stack, vpcCidr, azCount, enableNatGateway, awsProvider } =
    config;

  const vpc = new awsx.ec2.Vpc(
    `${namePrefix}-vpc`,
    {
      cidrBlock: vpcCidr,
      numberOfAvailabilityZones: azCount,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: enableNatGateway
        ? { strategy: awsx.ec2.NatGatewayStrategy.OnePerAz }
        : { strategy: awsx.ec2.NatGatewayStrategy.None },
      subnetStrategy: awsx.ec2.SubnetAllocationStrategy.Auto,
      subnetSpecs: [
        { type: awsx.ec2.SubnetType.Public, name: 'public', cidrMask: 24 },
        { type: awsx.ec2.SubnetType.Private, name: 'private', cidrMask: 24 },
      ],
      tags: {
        Name: `${namePrefix}-vpc`,
        Environment: stack,
        Project: 'soccer-stats',
      },
    },
    { provider: awsProvider },
  );

  return {
    vpc,
    vpcId: vpc.vpcId,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,
  };
}
