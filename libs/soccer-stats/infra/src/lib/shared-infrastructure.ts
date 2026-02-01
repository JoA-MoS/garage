import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { SharedInfraConfig, SharedInfraOutputs } from './types';
import {
  createVpc,
  createSecurityGroups,
  createEcsCluster,
  createLoadBalancer,
  createEcrRepository,
  createIamRoles,
  grantSecretAccess,
  createLogGroup,
  createDatabase,
} from './modules';

/**
 * Creates shared AWS infrastructure for soccer-stats application.
 * This includes VPC, ECS cluster, ALB, ECR, Aurora/RDS PostgreSQL, and supporting resources.
 *
 * @param config - Optional configuration overrides
 * @returns All infrastructure outputs for use by dependent stacks
 */
export function createSharedInfrastructure(
  config: SharedInfraConfig = {},
): SharedInfraOutputs {
  const stack = pulumi.getStack();

  // ===========================================================================
  // Configuration with defaults
  // ===========================================================================
  const vpcCidr = config.vpcCidr || '10.0.0.0/16';
  const azCount = config.azCount || 2;
  // NAT Gateway disabled by default - public subnets with security groups provide
  // equivalent security for this use case while saving ~$32+/month
  const enableNatGateway = config.enableNatGateway ?? false;
  const containerPort = config.containerPort || 3333;

  // Database configuration
  const dbName = config.databaseName || 'soccer_stats';
  const dbUsername = config.databaseUsername || 'postgres';
  // Use Aurora Serverless v2 for prod, Standard RDS for dev (much cheaper)
  const useAurora = config.useAuroraServerless ?? stack === 'prod';
  const dbInstanceClass = config.databaseInstanceClass || 'db.t3.micro';
  const dbMinCapacity = config.databaseMinCapacity || 0.5;
  const dbMaxCapacity = config.databaseMaxCapacity || 4;

  // Naming convention
  const namePrefix = `soccer-stats-${stack}`;

  // ===========================================================================
  // AWS Provider (explicit to ensure credential resolution for awsx components)
  // ===========================================================================
  const awsProvider = new aws.Provider(`${namePrefix}-aws-provider`, {
    region: aws.config.region,
  });

  // ===========================================================================
  // Create Infrastructure Modules
  // ===========================================================================

  // VPC with public and private subnets
  const vpc = createVpc({
    namePrefix,
    stack,
    vpcCidr,
    azCount,
    enableNatGateway,
    awsProvider,
  });

  // Security groups for ALB, ECS, and RDS
  // In dev, allow public access to RDS for local development
  const securityGroups = createSecurityGroups({
    namePrefix,
    stack,
    vpcId: vpc.vpcId,
    containerPort,
    awsProvider,
    allowPublicRdsAccess: stack !== 'prod',
  });

  // ECS cluster with Fargate capacity providers
  const ecs = createEcsCluster({
    namePrefix,
    stack,
    awsProvider,
  });

  // Application Load Balancer with target group and listeners
  const loadBalancer = createLoadBalancer({
    namePrefix,
    stack,
    vpcId: vpc.vpcId,
    publicSubnetIds: vpc.publicSubnetIds,
    albSecurityGroupId: securityGroups.albSecurityGroup.id,
    containerPort,
    awsProvider,
  });

  // ECR repository for Docker images
  const ecr = createEcrRepository({
    namePrefix,
    stack,
    awsProvider,
  });

  // IAM roles for ECS task execution and runtime
  const iam = createIamRoles({
    namePrefix,
    stack,
    awsProvider,
  });

  // CloudWatch log group for container logs
  const logging = createLogGroup({
    namePrefix,
    stack,
    awsProvider,
  });

  // Database (Aurora Serverless v2 for prod, Standard RDS for dev)
  // In dev, make publicly accessible for local development (requires public subnets)
  const database = createDatabase({
    namePrefix,
    stack,
    privateSubnetIds: vpc.privateSubnetIds,
    publicSubnetIds: vpc.publicSubnetIds,
    rdsSecurityGroupId: securityGroups.rdsSecurityGroup.id,
    dbName,
    dbUsername,
    useAurora,
    dbInstanceClass,
    dbMinCapacity,
    dbMaxCapacity,
    awsProvider,
    publiclyAccessible: stack !== 'prod', // Allow direct access in dev for local development
  });

  // Grant ECS task execution role permission to read the database secret
  grantSecretAccess(
    namePrefix,
    iam.taskExecutionRole,
    database.dbSecret.arn,
    awsProvider,
  );

  // ===========================================================================
  // Return all outputs for use by dependent stacks
  // ===========================================================================
  return {
    // VPC
    vpcId: vpc.vpcId,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,

    // Security Groups
    albSecurityGroupId: securityGroups.albSecurityGroup.id,
    ecsSecurityGroupId: securityGroups.ecsSecurityGroup.id,
    rdsSecurityGroupId: securityGroups.rdsSecurityGroup.id,

    // ECS
    clusterArn: ecs.clusterArn,
    clusterName: ecs.clusterName,

    // Load Balancer
    albArn: loadBalancer.albArn,
    albDnsName: loadBalancer.albDnsName,
    albZoneId: loadBalancer.albZoneId,
    apiTargetGroupArn: loadBalancer.apiTargetGroupArn,
    httpListenerArn: loadBalancer.httpListenerArn,

    // ECR
    ecrRepositoryUrl: ecr.repositoryUrl,
    ecrRepositoryArn: ecr.repositoryArn,

    // IAM
    taskExecutionRoleArn: iam.taskExecutionRoleArn,
    taskRoleArn: iam.taskRoleArn,

    // Logging
    logGroupName: logging.logGroupName,
    logGroupArn: logging.logGroupArn,

    // Database
    databaseEndpoint: database.dbEndpoint,
    databasePort: database.dbPort,
    databaseName: database.databaseName,
    databaseUsername: database.databaseUsername,
    databaseSecretArn: database.databaseSecretArn,

    // Convenience
    environment: stack,
    region: pulumi.output(aws.config.region || 'us-west-2'),
  };
}
