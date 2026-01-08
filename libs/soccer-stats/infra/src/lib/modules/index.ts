// Infrastructure modules - each handles one logical concern
export { createVpc, type VpcConfig, type VpcOutputs } from './vpc';
export {
  createSecurityGroups,
  type SecurityGroupsConfig,
  type SecurityGroupsOutputs,
} from './security-groups';
export { createEcsCluster, type EcsConfig, type EcsOutputs } from './ecs';
export {
  createLoadBalancer,
  type LoadBalancerConfig,
  type LoadBalancerOutputs,
} from './load-balancer';
export { createEcrRepository, type EcrConfig, type EcrOutputs } from './ecr';
export {
  createIamRoles,
  grantSecretAccess,
  type IamConfig,
  type IamOutputs,
} from './iam';
export {
  createLogGroup,
  type LoggingConfig,
  type LoggingOutputs,
} from './logging';
export {
  createDatabase,
  type DatabaseConfig,
  type DatabaseOutputs,
} from './database';
