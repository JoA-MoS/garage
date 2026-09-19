import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupsConfig {
  namePrefix: string;
  stack: string;
  vpcId: pulumi.Output<string>;
  /** VPC CIDR — used to allow NAT forwarding from private subnets through the bastion */
  vpcCidr: string;
  /** Container port the API listens on — ALB and Fargate task SGs need this for ingress rules */
  containerPort: number;
  awsProvider: aws.Provider;
}

export interface SecurityGroupsOutputs {
  albSecurityGroup: aws.ec2.SecurityGroup;
  fargateSecurityGroup: aws.ec2.SecurityGroup;
  bastionSecurityGroup: aws.ec2.SecurityGroup;
  rdsSecurityGroup: aws.ec2.SecurityGroup;
}

/** Creates security groups for the ALB, Fargate service, bastion, and Aurora. */
export function createSecurityGroups(
  config: SecurityGroupsConfig,
): SecurityGroupsOutputs {
  const { namePrefix, stack, vpcId, vpcCidr, containerPort, awsProvider } =
    config;

  // ALB SG — public-facing HTTP ingress (CloudFront terminates TLS at the
  // edge and talks plain HTTP to this ALB), open egress to reach the
  // Fargate tasks it forwards to.
  const albSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-alb-sg`,
    {
      vpcId,
      description:
        'Security group for the API ALB - HTTP ingress from CloudFront, egress to Fargate tasks',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP inbound from CloudFront',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow outbound to Fargate tasks',
        },
      ],
      tags: { Name: `${namePrefix}-alb-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Fargate task SG — ingress from the ALB only, egress to Aurora and HTTPS
  // (Clerk API via NAT), same role the App Runner VPC Connector SG used to play.
  const fargateSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-fargate-sg`,
    {
      vpcId,
      description:
        'Security group for the API Fargate service - ingress from ALB, egress to Aurora and HTTPS',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: containerPort,
          toPort: containerPort,
          securityGroups: [albSecurityGroup.id],
          description: 'Allow traffic from the ALB',
        },
      ],
      egress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          cidrBlocks: [vpcCidr],
          description: 'Allow PostgreSQL outbound to Aurora (VPC only)',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description:
            'Allow HTTPS outbound (Clerk API, AWS APIs) via NAT bastion',
        },
      ],
      tags: {
        Name: `${namePrefix}-fargate-sg`,
        Environment: stack,
      },
    },
    { provider: awsProvider },
  );

  // Bastion/NAT SG — no inbound from internet (SSM connects without open ports).
  // Ingress from VPC CIDR so private subnets can route internet traffic through
  // the fck-nat instance; egress open for NAT forwarding and SSM.
  const bastionSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-bastion-sg`,
    {
      vpcId,
      description:
        'Security group for SSM bastion + fck-nat - ingress from VPC only, open egress for NAT',
      ingress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: [vpcCidr],
          description: 'Allow all traffic from VPC for NAT forwarding',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound (NAT forwarding, SSM, Aurora)',
        },
      ],
      tags: { Name: `${namePrefix}-bastion-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // RDS SG — inbound from the Fargate service and bastion only
  const rdsSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-rds-sg`,
    {
      vpcId,
      description:
        'Security group for Aurora - ingress from the Fargate service and bastion',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [fargateSecurityGroup.id],
          description: 'Allow PostgreSQL from the Fargate service',
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
    albSecurityGroup,
    fargateSecurityGroup,
    bastionSecurityGroup,
    rdsSecurityGroup,
  };
}
