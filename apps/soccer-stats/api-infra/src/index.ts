import * as pulumi from '@pulumi/pulumi';

import {
  stack,
  minCapacity,
  maxCapacity,
  cpuTargetUtilization,
} from './config';
import { albDnsName } from './shared-infra';
import { image } from './docker';
import { taskDefinition, service } from './ecs';
import { scalingTarget, cpuScalingPolicy } from './autoscaling';

// Import secrets to ensure they're created (side effect)
import './secrets';

// =============================================================================
// Exports
// =============================================================================
export const serviceName = service.name;
export const serviceArn = service.id;
export const taskDefinitionArn = taskDefinition.arn;
export const imageUri = image.ref;
export const apiUrl = pulumi.interpolate`http://${albDnsName}`;
export const environment = stack;

// Auto-scaling exports
export const scalingTargetId = scalingTarget.id;
export const cpuScalingPolicyArn = cpuScalingPolicy.arn;
export const autoScalingConfig = {
  minCapacity,
  maxCapacity,
  cpuTargetUtilization,
};
