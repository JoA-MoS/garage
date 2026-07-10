import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupsConfig {
  namePrefix: string;
  stack: string;
  vpcId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface SecurityGroupsOutputs {
  appRunnerConnectorSecurityGroup: aws.ec2.SecurityGroup;
  bastionSecurityGroup: aws.ec2.SecurityGroup;
  rdsSecurityGroup: aws.ec2.SecurityGroup;
}

/** Creates security groups for App Runner VPC Connector, bastion, and Aurora. */
export function createSecurityGroups(
  config: SecurityGroupsConfig,
): SecurityGroupsOutputs {
  const { namePrefix, stack, vpcId, awsProvider } = config;

  // App Runner VPC Connector SG — outbound to Aurora only
  const appRunnerConnectorSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-apprunner-connector-sg`,
    {
      vpcId,
      description:
        'Security group for App Runner VPC Connector — egress to Aurora',
      egress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow PostgreSQL outbound to Aurora',
        },
      ],
      tags: {
        Name: `${namePrefix}-apprunner-connector-sg`,
        Environment: stack,
      },
    },
    { provider: awsProvider },
  );

  // Bastion SG — no inbound (SSM connects without open ports), outbound to Aurora + internet for SSM
  const bastionSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-bastion-sg`,
    {
      vpcId,
      description:
        'Security group for SSM bastion — no inbound, outbound to Aurora and internet',
      egress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow PostgreSQL outbound to Aurora',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS for SSM agent communication',
        },
      ],
      tags: { Name: `${namePrefix}-bastion-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // RDS SG — inbound from App Runner connector and bastion only
  const rdsSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-rds-sg`,
    {
      vpcId,
      description:
        'Security group for Aurora — ingress from App Runner connector and bastion',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [appRunnerConnectorSecurityGroup.id],
          description: 'Allow PostgreSQL from App Runner VPC Connector',
        },
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [bastionSecurityGroup.id],
          description: 'Allow PostgreSQL from bastion for local dev access',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: { Name: `${namePrefix}-rds-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    appRunnerConnectorSecurityGroup,
    bastionSecurityGroup,
    rdsSecurityGroup,
  };
}
