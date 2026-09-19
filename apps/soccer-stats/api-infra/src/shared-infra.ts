import { getSharedInfraStackReference } from './stack-reference';

// =============================================================================
// Import Shared Infrastructure
// =============================================================================
const sharedInfra = getSharedInfraStackReference();

export const ecrRepositoryUrl = sharedInfra.requireOutput('ecrRepositoryUrl');
export const publicSubnetIds = sharedInfra.requireOutput('publicSubnetIds');
export const privateSubnetIds = sharedInfra.requireOutput('privateSubnetIds');
export const vpcId = sharedInfra.requireOutput('vpcId');
export const albSecurityGroupId =
  sharedInfra.requireOutput('albSecurityGroupId');
export const fargateSecurityGroupId = sharedInfra.requireOutput(
  'fargateSecurityGroupId',
);
export const ecsTaskExecutionRoleArn = sharedInfra.requireOutput(
  'ecsTaskExecutionRoleArn',
);
export const ecsTaskRoleArn = sharedInfra.requireOutput('ecsTaskRoleArn');
export const originVerifySecret =
  sharedInfra.requireOutput('originVerifySecret');
export const databaseUrlSecretArn = sharedInfra.requireOutput(
  'databaseUrlSecretArn',
);
export const databaseSecretArn = sharedInfra.requireOutput('databaseSecretArn');
