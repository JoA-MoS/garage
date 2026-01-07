import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupsConfig {
  namePrefix: string;
  stack: string;
  vpcId: pulumi.Output<string>;
  containerPort: number;
  awsProvider: aws.Provider;
}

export interface SecurityGroupsOutputs {
  albSecurityGroup: aws.ec2.SecurityGroup;
  ecsSecurityGroup: aws.ec2.SecurityGroup;
  rdsSecurityGroup: aws.ec2.SecurityGroup;
}

/**
 * Creates security groups for ALB, ECS tasks, and RDS.
 */
export function createSecurityGroups(
  config: SecurityGroupsConfig,
): SecurityGroupsOutputs {
  const { namePrefix, stack, vpcId, containerPort, awsProvider } = config;

  // ALB Security Group - allows HTTP/HTTPS from internet
  const albSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-alb-sg`,
    {
      vpcId,
      description: 'Security group for Application Load Balancer',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS',
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
      tags: { Name: `${namePrefix}-alb-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // ECS Security Group - allows traffic from ALB only
  const ecsSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-ecs-sg`,
    {
      vpcId,
      description: 'Security group for ECS tasks',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: containerPort,
          toPort: containerPort,
          securityGroups: [albSecurityGroup.id],
          description: 'Allow traffic from ALB',
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
      tags: { Name: `${namePrefix}-ecs-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // RDS Security Group - allows PostgreSQL from ECS tasks only
  const rdsSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-rds-sg`,
    {
      vpcId,
      description: 'Security group for RDS PostgreSQL',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [ecsSecurityGroup.id],
          description: 'Allow PostgreSQL from ECS tasks',
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
    ecsSecurityGroup,
    rdsSecurityGroup,
  };
}
