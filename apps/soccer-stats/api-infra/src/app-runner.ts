import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import {
  namePrefix,
  stack,
  containerPort,
  frontendUrl,
  dbPoolMax,
  dbPoolMin,
  dbPoolIdleTimeout,
  dbPoolConnectionTimeout,
  observabilityLogLevel,
  slowQueryThresholdMs,
  queryComplexityLimit,
  dataLoaderBatchSizeWarning,
  clerkPublishableKey,
} from './config';
import {
  ecrRepositoryUrl,
  vpcConnectorArn,
  appRunnerAccessRoleArn,
  appRunnerInstanceRoleArn,
  databaseUrlSecretArn,
} from './shared-infra';
import { clerkSecretKeySecretArn } from './secrets';
import { image } from './docker';

const autoScalingConfig = new aws.apprunner.AutoScalingConfigurationVersion(
  `${namePrefix}-autoscaling`,
  {
    autoScalingConfigurationName: namePrefix,
    maxConcurrency: 100,
    minSize: 1,
    maxSize: 10,
    tags: { Name: `${namePrefix}-autoscaling`, Environment: stack },
  },
);

export const service = new aws.apprunner.Service(
  `${namePrefix}-service`,
  {
    serviceName: namePrefix,
    autoScalingConfigurationArn: autoScalingConfig.arn,
    sourceConfiguration: {
      authenticationConfiguration: {
        accessRoleArn: appRunnerAccessRoleArn,
      },
      autoDeploymentsEnabled: true,
      imageRepository: {
        // Reference the stack-tagged image (:dev, :prod, etc.)
        // App Runner auto-deploys when docker.ts pushes a new image with this tag
        imageIdentifier: pulumi.interpolate`${ecrRepositoryUrl}:${stack}`,
        imageRepositoryType: 'ECR',
        imageConfiguration: {
          port: containerPort.toString(),
          runtimeEnvironmentVariables: {
            NODE_ENV: 'production',
            PORT: containerPort.toString(),
            DB_SYNCHRONIZE: 'false',
            DB_POOL_MAX: dbPoolMax.toString(),
            DB_POOL_MIN: dbPoolMin.toString(),
            DB_POOL_IDLE_TIMEOUT: dbPoolIdleTimeout.toString(),
            DB_POOL_CONNECTION_TIMEOUT: dbPoolConnectionTimeout.toString(),
            DB_SSL: 'true',
            NO_COLOR: 'true',
            LOG_FORMAT: 'json',
            OBSERVABILITY_LOG_LEVEL: observabilityLogLevel,
            SLOW_QUERY_THRESHOLD_MS: slowQueryThresholdMs.toString(),
            QUERY_COMPLEXITY_LIMIT: queryComplexityLimit.toString(),
            DATALOADER_BATCH_SIZE_WARNING:
              dataLoaderBatchSizeWarning.toString(),
            CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
            ...(frontendUrl ? { FRONTEND_URL: frontendUrl } : {}),
          },
          runtimeEnvironmentSecrets: pulumi
            .all([databaseUrlSecretArn, clerkSecretKeySecretArn])
            .apply(([dbUrlArn, clerkArn]) => ({
              DATABASE_URL: dbUrlArn as string,
              CLERK_SECRET_KEY: clerkArn,
            })),
        },
      },
    },
    networkConfiguration: {
      egressConfiguration: {
        egressType: 'VPC',
        vpcConnectorArn: vpcConnectorArn as pulumi.Output<string>,
      },
    },
    instanceConfiguration: {
      cpu: '0.25 vCPU',
      memory: '0.5 GB',
      instanceRoleArn: appRunnerInstanceRoleArn,
    },
    healthCheckConfiguration: {
      protocol: 'HTTP',
      path: '/api/health',
      interval: 10,
      timeout: 5,
      healthyThreshold: 1,
      // 20 × 10s = 200 seconds to become healthy — covers Aurora cold start (15–40s) + migrations
      unhealthyThreshold: 20,
    },
    tags: { Name: `${namePrefix}-service`, Environment: stack },
  },
  { dependsOn: [image] },
);

export const serviceUrl = service.serviceUrl;
export const serviceArn = service.arn;
