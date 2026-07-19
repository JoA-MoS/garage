import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BastionConfig {
  namePrefix: string;
  stack: string;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  /** Number of private subnets (static, used to create NAT routes) */
  azCount: number;
  /**
   * Install 0.0.0.0/0 routes for the private subnets through this instance.
   * Must be false when the VPC has managed NAT gateways, which own those
   * routes — otherwise the two fight over the same route table entries.
   */
  manageNatRoutes: boolean;
  bastionSecurityGroupId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface BastionOutputs {
  instance: aws.ec2.Instance;
  instanceId: pulumi.Output<string>;
}

/**
 * Creates a t4g.nano fck-nat instance that doubles as:
 * - NAT for private subnets (App Runner VPC egress needs internet for Clerk API calls)
 * - SSM bastion for port-forward tunnels to Aurora (no SSH keys, no open inbound ports)
 *
 * fck-nat is AL2023-based, so the SSM agent is preinstalled.
 * See https://fck-nat.dev for details.
 */
export function createBastion(config: BastionConfig): BastionOutputs {
  const {
    namePrefix,
    stack,
    publicSubnetIds,
    privateSubnetIds,
    azCount,
    manageNatRoutes,
    bastionSecurityGroupId,
    awsProvider,
  } = config;

  // SSM instance profile — grants Systems Manager access with no SSH keys required
  const bastionRole = new aws.iam.Role(
    `${namePrefix}-bastion-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'ec2.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-bastion-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-bastion-ssm-policy`,
    {
      role: bastionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    },
    { provider: awsProvider },
  );

  const bastionInstanceProfile = new aws.iam.InstanceProfile(
    `${namePrefix}-bastion-profile`,
    { role: bastionRole.name },
    { provider: awsProvider },
  );

  // fck-nat AMI (AL2023 arm64 with NAT preconfigured) — t4g requires ARM64
  const ami = aws.ec2.getAmiOutput(
    {
      mostRecent: true,
      owners: ['568608671756'], // fck-nat official AMI owner
      filters: [
        { name: 'name', values: ['fck-nat-al2023-*-arm64-ebs'] },
        { name: 'state', values: ['available'] },
      ],
    },
    { provider: awsProvider },
  );

  const instance = new aws.ec2.Instance(
    `${namePrefix}-bastion`,
    {
      ami: ami.id,
      instanceType: 't4g.nano',
      subnetId: publicSubnetIds.apply((ids) => ids[0]),
      vpcSecurityGroupIds: [bastionSecurityGroupId],
      iamInstanceProfile: bastionInstanceProfile.name,
      associatePublicIpAddress: true,
      // Required for NAT: the instance forwards traffic that is not addressed to itself
      sourceDestCheck: false,
      tags: { Name: `${namePrefix}-bastion`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Route each private subnet's default route through the NAT instance.
  // azCount is static, so routes are created outside of .apply().
  for (let i = 0; i < (manageNatRoutes ? azCount : 0); i++) {
    const routeTable = aws.ec2.getRouteTableOutput(
      { subnetId: privateSubnetIds.apply((ids) => ids[i]) },
      { provider: awsProvider },
    );
    new aws.ec2.Route(
      `${namePrefix}-private-nat-route-${i}`,
      {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        networkInterfaceId: instance.primaryNetworkInterfaceId,
      },
      { provider: awsProvider, deleteBeforeReplace: true },
    );
  }

  return {
    instance,
    instanceId: instance.id,
  };
}
