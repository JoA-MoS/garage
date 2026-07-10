// Infrastructure modules - each handles one logical concern
export { createVpc, type VpcConfig, type VpcOutputs } from './vpc';
export {
  createSecurityGroups,
  type SecurityGroupsConfig,
  type SecurityGroupsOutputs,
} from './security-groups';
export {
  createVpcConnector,
  type VpcConnectorConfig,
  type VpcConnectorOutputs,
} from './vpc-connector';
export {
  createBastion,
  type BastionConfig,
  type BastionOutputs,
} from './bastion';
export { createEcrRepository, type EcrConfig, type EcrOutputs } from './ecr';
export {
  createIamRoles,
  grantSecretAccess,
  type IamConfig,
  type IamOutputs,
} from './iam';
export {
  createDatabase,
  type DatabaseConfig,
  type DatabaseOutputs,
} from './database';
