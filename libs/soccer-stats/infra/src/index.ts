export * from './lib/types';
export * from './lib/shared-infrastructure';

// =============================================================================
// Soccer Stats Shared Infrastructure - Pulumi Stack
// =============================================================================
// This stack creates the foundational AWS resources used by both the API and UI:
// - VPC with public/private subnets
// - Security groups for the ALB and Fargate service
// - Aurora Serverless v2 PostgreSQL (min 0 ACU — scales to zero)
// - SSM bastion (t4g.nano) for local DB tunnels
// - ECR repository for Docker images
// - IAM roles for ECS task execution and the running task
//
// Dependent stacks (api-infra, ui-infra) import these outputs via StackReference.
// =============================================================================

import * as pulumi from '@pulumi/pulumi';

import { createSharedInfrastructure } from './lib/shared-infrastructure';

const outputs = createSharedInfrastructure();

// Export all outputs for dependent stacks to consume via StackReference
export const vpcId = outputs.vpcId;
export const publicSubnetIds = outputs.publicSubnetIds;
export const privateSubnetIds = outputs.privateSubnetIds;
export const albSecurityGroupId = outputs.albSecurityGroupId;
export const fargateSecurityGroupId = outputs.fargateSecurityGroupId;
export const ecsTaskExecutionRoleArn = outputs.ecsTaskExecutionRoleArn;
export const ecsTaskRoleArn = outputs.ecsTaskRoleArn;
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
// CloudFront -> ALB request authenticity
export const originVerifySecret = pulumi.secret(outputs.originVerifySecret);
// Convenience
export const environment = outputs.environment;
export const region = outputs.region;
