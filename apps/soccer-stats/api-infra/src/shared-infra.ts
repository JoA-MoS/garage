import { getSharedInfraStackReference } from './stack-reference';

// =============================================================================
// Import Shared Infrastructure
// =============================================================================
const sharedInfra = getSharedInfraStackReference();

export const ecrRepositoryUrl = sharedInfra.requireOutput('ecrRepositoryUrl');
export const vpcConnectorArn = sharedInfra.requireOutput('vpcConnectorArn');
export const appRunnerAccessRoleArn = sharedInfra.requireOutput(
  'appRunnerAccessRoleArn',
);
export const appRunnerInstanceRoleArn = sharedInfra.requireOutput(
  'appRunnerInstanceRoleArn',
);
export const databaseUrlSecretArn = sharedInfra.requireOutput(
  'databaseUrlSecretArn',
);
export const databaseSecretArn = sharedInfra.requireOutput('databaseSecretArn');
