import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import {
  namePrefix,
  stack,
  minCapacity,
  maxCapacity,
  cpuTargetUtilization,
} from './config';
import { clusterArn } from './shared-infra';
import { service } from './ecs';

// =============================================================================
// Auto Scaling
// =============================================================================
// Scale based on CPU utilization to handle weekend usage spikes
// Min: 1 task (cost savings during quiet periods)
// Max: 4 tasks (handle spikes without breaking the bank on Spot)

export const scalingTarget = new aws.appautoscaling.Target(
  `${namePrefix}-scaling-target`,
  {
    maxCapacity: maxCapacity,
    minCapacity: minCapacity,
    resourceId: pulumi.interpolate`service/${clusterArn.apply((arn: string) => arn.split('/').pop())}/${service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
    tags: {
      Name: `${namePrefix}-scaling-target`,
      Environment: stack,
    },
  },
);

// Target tracking policy: Scale to maintain target CPU utilization
export const cpuScalingPolicy = new aws.appautoscaling.Policy(
  `${namePrefix}-cpu-scaling`,
  {
    name: `${namePrefix}-cpu-scaling`,
    policyType: 'TargetTrackingScaling',
    resourceId: scalingTarget.resourceId,
    scalableDimension: scalingTarget.scalableDimension,
    serviceNamespace: scalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
      predefinedMetricSpecification: {
        predefinedMetricType: 'ECSServiceAverageCPUUtilization',
      },
      targetValue: cpuTargetUtilization,
      scaleInCooldown: 300, // 5 min cooldown before scaling in (avoid flapping)
      scaleOutCooldown: 60, // 1 min cooldown before scaling out (respond quickly to spikes)
    },
  },
);

// Future enhancement: Add ALBRequestCountPerTarget scaling policy
// for faster response to sudden traffic spikes (requires ALB ARN export from shared infra)
