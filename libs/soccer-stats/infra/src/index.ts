export * from './lib/types';
export * from './lib/shared-infrastructure';

// =============================================================================
// Soccer Stats Shared Infrastructure - Pulumi Stack
// =============================================================================
// This stack creates the foundational AWS resources used by both the API and UI:
// - VPC with public/private subnets
// - App Runner VPC Connector (bridges App Runner into the VPC)
// - Aurora Serverless v2 PostgreSQL (min 0 ACU — scales to zero)
// - SSM bastion (t4g.nano) for local DB tunnels
// - ECR repository for Docker images
// - IAM roles for App Runner image pull and runtime
//
// Dependent stacks (api-infra, ui-infra) import these outputs via StackReference.
// =============================================================================

import { createSharedInfrastructure } from './lib/shared-infrastructure';

const outputs = createSharedInfrastructure();

// Export all outputs for dependent stacks to consume via StackReference
export const vpcId = outputs.vpcId;
export const publicSubnetIds = outputs.publicSubnetIds;
export const privateSubnetIds = outputs.privateSubnetIds;
export const appRunnerConnectorSecurityGroupId =
  outputs.appRunnerConnectorSecurityGroupId;
export const vpcConnectorArn = outputs.vpcConnectorArn;
export const appRunnerAccessRoleArn = outputs.appRunnerAccessRoleArn;
export const appRunnerInstanceRoleArn = outputs.appRunnerInstanceRoleArn;
export const ecrRepositoryUrl = outputs.ecrRepositoryUrl;
export const ecrRepositoryArn = outputs.ecrRepositoryArn;
// Database
export const rdsSecurityGroupId = outputs.rdsSecurityGroupId;
export const databaseEndpoint = outputs.databaseEndpoint;
export const databasePort = outputs.databasePort;
export const databaseName = outputs.databaseName;
export const databaseUsername = outputs.databaseUsername;
export const databaseSecretArn = outputs.databaseSecretArn;
export const databaseUrlSecretArn = outputs.databaseUrlSecretArn;
// Bastion
export const bastionInstanceId = outputs.bastionInstanceId;
// CI/CD
export const cdRoleArn = outputs.cdRoleArn;
// Convenience
export const environment = outputs.environment;
export const region = outputs.region;
