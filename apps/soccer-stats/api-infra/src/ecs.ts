import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import {
  namePrefix,
  stack,
  containerPort,
  cpu,
  memory,
  desiredCount,
  frontendUrl,
} from './config';
import {
  clusterArn,
  ecsSecurityGroupId,
  privateSubnetIds,
  publicSubnetIds,
  apiTargetGroupArn,
  taskExecutionRoleArn,
  taskRoleArn,
  logGroupName,
  databaseSecretArn,
} from './shared-infra';
import { clerkSecret } from './secrets';
import { image, currentRegion } from './docker';

// =============================================================================
// ECS Task Definition
// =============================================================================
// Shared database secrets configuration for both containers
const databaseSecrets = (dbSecretArn: string) => [
  { name: 'DB_HOST', valueFrom: `${dbSecretArn}:host::` },
  { name: 'DB_PORT', valueFrom: `${dbSecretArn}:port::` },
  { name: 'DB_USERNAME', valueFrom: `${dbSecretArn}:username::` },
  { name: 'DB_PASSWORD', valueFrom: `${dbSecretArn}:password::` },
  { name: 'DB_NAME', valueFrom: `${dbSecretArn}:database::` },
];

export const taskDefinition = new aws.ecs.TaskDefinition(`${namePrefix}-task`, {
  family: namePrefix,
  networkMode: 'awsvpc',
  requiresCompatibilities: ['FARGATE'],
  cpu: cpu.toString(),
  memory: memory.toString(),
  executionRoleArn: taskExecutionRoleArn,
  taskRoleArn: taskRoleArn,
  containerDefinitions: pulumi
    .all([
      image.ref,
      logGroupName,
      databaseSecretArn,
      clerkSecret.arn,
      currentRegion.name,
    ])
    .apply(([imageRef, logGroup, dbSecretArn, clerkSecretArn, region]) =>
      JSON.stringify([
        // =====================================================================
        // Migration Container - Runs before API starts
        // =====================================================================
        // This container runs database migrations and exits. The API container
        // depends on this completing successfully before starting.
        // Pattern inspired by: https://atlasgo.io/guides/deploying/aws-ecs-fargate
        {
          name: 'migrations',
          image: imageRef,
          essential: false, // Can exit after completion
          command: ['node', 'run-migrations.js'],
          environment: [
            { name: 'NODE_ENV', value: 'production' },
            // Disable ANSI color codes for cleaner CloudWatch logs
            { name: 'NO_COLOR', value: 'true' },
          ],
          secrets: databaseSecrets(dbSecretArn),
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup,
              'awslogs-region': region,
              'awslogs-stream-prefix': 'migrations',
            },
          },
        },
        // =====================================================================
        // API Container - Main application
        // =====================================================================
        {
          name: 'api',
          image: imageRef,
          essential: true,
          // Wait for migrations to complete successfully before starting
          dependsOn: [
            {
              containerName: 'migrations',
              condition: 'SUCCESS',
            },
          ],
          portMappings: [
            {
              containerPort: containerPort,
              protocol: 'tcp',
            },
          ],
          environment: [
            { name: 'NODE_ENV', value: 'production' },
            { name: 'PORT', value: containerPort.toString() },
            // Disable TypeORM auto-sync in production to prevent accidental schema changes
            { name: 'DB_SYNCHRONIZE', value: 'false' },
            // Disable ANSI color codes for cleaner CloudWatch logs
            { name: 'NO_COLOR', value: 'true' },
            // CORS allowed origins (optional - if unset, allows all origins)
            ...(frontendUrl
              ? [{ name: 'FRONTEND_URL', value: frontendUrl }]
              : []),
          ],
          secrets: [
            // Database credentials from AWS Secrets Manager
            ...databaseSecrets(dbSecretArn),
            // Clerk authentication credentials
            {
              name: 'CLERK_SECRET_KEY',
              valueFrom: `${clerkSecretArn}:secretKey::`,
            },
            {
              name: 'CLERK_PUBLISHABLE_KEY',
              valueFrom: `${clerkSecretArn}:publishableKey::`,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup,
              'awslogs-region': region,
              'awslogs-stream-prefix': 'api',
            },
          },
          healthCheck: {
            command: [
              'CMD-SHELL',
              `wget --no-verbose --tries=1 --spider http://localhost:${containerPort}/api/health || exit 1`,
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ]),
    ),
  tags: {
    Name: `${namePrefix}-task`,
    Environment: stack,
  },
});

// =============================================================================
// ECS Service
// =============================================================================
// Determine which subnets to use based on NAT gateway availability
// In dev (no NAT), tasks must be in public subnets with public IPs
// In prod (with NAT), tasks should be in private subnets
const usePrivateSubnets = stack === 'prod';

export const service = new aws.ecs.Service(`${namePrefix}-service`, {
  name: namePrefix,
  cluster: clusterArn,
  taskDefinition: taskDefinition.arn,
  desiredCount: desiredCount,
  // Use capacity provider strategy instead of launchType
  // (they are mutually exclusive in ECS)
  // Beta phase: Use FARGATE_SPOT for all environments (60-70% cost savings)
  // Usage pattern: Weekend spikes with minimal weekday traffic makes Spot ideal
  // TODO: Re-evaluate for prod when usage stabilizes post-beta
  capacityProviderStrategies: [
    { capacityProvider: 'FARGATE_SPOT', weight: 1, base: 1 },
  ],
  networkConfiguration: {
    subnets: usePrivateSubnets ? privateSubnetIds : publicSubnetIds,
    securityGroups: [ecsSecurityGroupId],
    // Public IP needed in dev (no NAT gateway)
    assignPublicIp: !usePrivateSubnets,
  },
  loadBalancers: [
    {
      targetGroupArn: apiTargetGroupArn,
      containerName: 'api',
      containerPort: containerPort,
    },
  ],
  // Deployment configuration
  deploymentMinimumHealthyPercent: 50,
  deploymentMaximumPercent: 200,
  // Enable ECS deployment circuit breaker
  deploymentCircuitBreaker: {
    enable: true,
    rollback: true,
  },
  // Wait for service to stabilize
  waitForSteadyState: false, // Set to true if you want Pulumi to wait
  tags: {
    Name: `${namePrefix}-service`,
    Environment: stack,
  },
});
