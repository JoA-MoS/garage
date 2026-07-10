import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BastionConfig {
  namePrefix: string;
  stack: string;
  publicSubnetIds: pulumi.Output<string[]>;
  bastionSecurityGroupId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface BastionOutputs {
  instance: aws.ec2.Instance;
  instanceId: pulumi.Output<string>;
}

/** Creates a t4g.nano EC2 bastion with SSM agent for SSM port-forward tunnels to Aurora. */
export function createBastion(config: BastionConfig): BastionOutputs {
  const {
    namePrefix,
    stack,
    publicSubnetIds,
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

  // Amazon Linux 2023 ARM64 (us-west-2) — t4g requires ARM64
  const ami = aws.ec2.getAmiOutput(
    {
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['al2023-ami-*-arm64'] },
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
      tags: { Name: `${namePrefix}-bastion`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    instance,
    instanceId: instance.id,
  };
}
