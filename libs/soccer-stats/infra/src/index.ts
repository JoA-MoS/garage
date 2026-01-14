export * from './lib/types';
export * from './lib/shared-infrastructure';

// =============================================================================
// Soccer Stats Shared Infrastructure - Pulumi Stack
// =============================================================================
// This stack creates the foundational AWS resources used by both the API and UI:
// - VPC with public/private subnets
// - ECS cluster with Fargate capacity providers
// - Application Load Balancer (supports WebSockets for GraphQL subscriptions)
// - ECR repository for Docker images
// - IAM roles for task execution
// - CloudWatch log group
//
// Dependent stacks (api-infra, ui-infra) import these outputs via StackReference.
// =============================================================================

import { createSharedInfrastructure } from './lib/shared-infrastructure';

const outputs = createSharedInfrastructure();

// Export all outputs for dependent stacks to consume via StackReference
export const vpcId = outputs.vpcId;
export const publicSubnetIds = outputs.publicSubnetIds;
export const privateSubnetIds = outputs.privateSubnetIds;
export const albSecurityGroupId = outputs.albSecurityGroupId;
export const ecsSecurityGroupId = outputs.ecsSecurityGroupId;
export const clusterArn = outputs.clusterArn;
export const clusterName = outputs.clusterName;
export const albArn = outputs.albArn;
export const albDnsName = outputs.albDnsName;
export const albZoneId = outputs.albZoneId;
export const apiTargetGroupArn = outputs.apiTargetGroupArn;
export const httpListenerArn = outputs.httpListenerArn;
export const ecrRepositoryUrl = outputs.ecrRepositoryUrl;
export const ecrRepositoryArn = outputs.ecrRepositoryArn;
export const taskExecutionRoleArn = outputs.taskExecutionRoleArn;
export const taskRoleArn = outputs.taskRoleArn;
export const logGroupName = outputs.logGroupName;
export const logGroupArn = outputs.logGroupArn;
// Database
export const rdsSecurityGroupId = outputs.rdsSecurityGroupId;
export const databaseEndpoint = outputs.databaseEndpoint;
export const databasePort = outputs.databasePort;
export const databaseName = outputs.databaseName;
export const databaseUsername = outputs.databaseUsername;
export const databaseSecretArn = outputs.databaseSecretArn;
// Convenience
export const environment = outputs.environment;
export const region = outputs.region;
