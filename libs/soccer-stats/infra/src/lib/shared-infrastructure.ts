import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { SharedInfraConfig, SharedInfraOutputs } from './types';
import {
  createVpc,
  createSecurityGroups,
  createBastion,
  createEcrRepository,
  createIamRoles,
  grantSecretAccess,
  createDatabase,
  createGithubOidc,
} from './modules';

/**
 * Creates shared AWS infrastructure for the soccer-stats application.
 * Includes VPC, App Runner networking, Aurora Serverless v2, ECR, IAM, and bastion.
 */
export function createSharedInfrastructure(
  config: SharedInfraConfig = {},
): SharedInfraOutputs {
  const stack = pulumi.getStack();

  const vpcCidr = config.vpcCidr || '10.0.0.0/16';
  const azCount = config.azCount || 2;
  const enableNatGateway = config.enableNatGateway ?? false;
  const containerPort = config.containerPort || 3333;
  const dbName = config.databaseName || 'soccer_stats';
  const dbUsername = config.databaseUsername || 'postgres';
  const dbMinCapacity = config.databaseMinCapacity ?? 0;
  const dbMaxCapacity = config.databaseMaxCapacity || 4;
  const namePrefix = `soccer-stats-${stack}`;

  const awsProvider = new aws.Provider(`${namePrefix}-aws-provider`, {
    region: aws.config.region,
  });

  const vpc = createVpc({
    namePrefix,
    stack,
    vpcCidr,
    azCount,
    enableNatGateway,
    awsProvider,
  });

  const securityGroups = createSecurityGroups({
    namePrefix,
    stack,
    vpcId: vpc.vpcId,
    vpcCidr,
    containerPort,
    awsProvider,
  });

  const bastion = createBastion({
    namePrefix,
    stack,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,
    azCount,
    // Managed NAT gateways own the private default routes when enabled;
    // otherwise the fck-nat bastion provides them
    manageNatRoutes: !enableNatGateway,
    bastionSecurityGroupId: securityGroups.bastionSecurityGroup.id,
    awsProvider,
  });

  const ecr = createEcrRepository({ namePrefix, stack, awsProvider });

  const iam = createIamRoles({ namePrefix, stack, awsProvider });

  const database = createDatabase({
    namePrefix,
    stack,
    privateSubnetIds: vpc.privateSubnetIds,
    publicSubnetIds: vpc.publicSubnetIds,
    rdsSecurityGroupId: securityGroups.rdsSecurityGroup.id,
    dbName,
    dbUsername,
    useAurora: true,
    dbInstanceClass: 'db.t3.micro',
    dbMinCapacity,
    dbMaxCapacity,
    awsProvider,
    publiclyAccessible: false,
  });

  // GitHub Actions OIDC provider + CD role for deploys from CI
  const githubOidc = createGithubOidc({
    namePrefix,
    stack,
    githubRepo: 'JoA-MoS/garage',
    awsProvider,
  });

  // Grant the ECS execution role access to both database secrets — it's the
  // execution role (not the task role) that resolves `secrets` referenced
  // in the container definition.
  grantSecretAccess(
    namePrefix,
    iam.ecsTaskExecutionRole,
    database.databaseSecretArn,
    awsProvider,
    'db',
  );
  grantSecretAccess(
    namePrefix,
    iam.ecsTaskExecutionRole,
    database.databaseUrlSecretArn,
    awsProvider,
    'db-url',
  );

  return {
    vpcId: vpc.vpcId,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,
    albSecurityGroupId: securityGroups.albSecurityGroup.id,
    fargateSecurityGroupId: securityGroups.fargateSecurityGroup.id,
    rdsSecurityGroupId: securityGroups.rdsSecurityGroup.id,
    ecsTaskExecutionRoleArn: iam.ecsTaskExecutionRoleArn,
    ecsTaskRoleArn: iam.ecsTaskRoleArn,
    ecrRepositoryUrl: ecr.repositoryUrl,
    ecrRepositoryArn: ecr.repositoryArn,
    databaseEndpoint: database.dbEndpoint,
    databasePort: database.dbPort,
    databaseName: database.databaseName,
    databaseUsername: database.databaseUsername,
    databaseSecretArn: database.databaseSecretArn,
    databaseUrlSecretArn: database.databaseUrlSecretArn,
    bastionInstanceId: bastion.instanceId,
    cdRoleArn: githubOidc.cdRoleArn,
    environment: stack,
    region: pulumi.output(aws.config.region || 'us-west-2'),
  };
}
