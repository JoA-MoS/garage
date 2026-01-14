import { getSharedInfraStackReference } from './stack-reference';

// =============================================================================
// Import Shared Infrastructure
// =============================================================================
const sharedInfra = getSharedInfraStackReference();

// Import outputs from shared infrastructure stack
export const clusterArn = sharedInfra.requireOutput('clusterArn');
export const ecsSecurityGroupId =
  sharedInfra.requireOutput('ecsSecurityGroupId');
export const privateSubnetIds = sharedInfra.requireOutput('privateSubnetIds');
export const publicSubnetIds = sharedInfra.requireOutput('publicSubnetIds');
export const apiTargetGroupArn = sharedInfra.requireOutput('apiTargetGroupArn');
export const taskExecutionRoleArn = sharedInfra.requireOutput(
  'taskExecutionRoleArn',
);
export const taskRoleArn = sharedInfra.requireOutput('taskRoleArn');
export const logGroupName = sharedInfra.requireOutput('logGroupName');
export const ecrRepositoryUrl = sharedInfra.requireOutput('ecrRepositoryUrl');
export const albDnsName = sharedInfra.requireOutput('albDnsName');
export const databaseSecretArn = sharedInfra.requireOutput('databaseSecretArn');
