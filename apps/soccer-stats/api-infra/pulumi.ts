import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as docker from '@pulumi/docker-build';

import { getSharedInfraStackReference } from './stack-reference';

// =============================================================================
// Configuration
// =============================================================================
const config = new pulumi.Config();
const stack = pulumi.getStack();

// Container configuration
const containerPort = config.getNumber('containerPort') || 3333;
const cpu = config.getNumber('cpu') || 256; // 0.25 vCPU
const memory = config.getNumber('memory') || 512; // 512 MB
const desiredCount = config.getNumber('desiredCount') || 1;

// Auto-scaling configuration
const minCapacity = config.getNumber('minCapacity') || 1;
const maxCapacity = config.getNumber('maxCapacity') || 4;
const cpuTargetUtilization = config.getNumber('cpuTargetUtilization') || 70;

// Clerk authentication (required)
const clerkSecretKey = config.requireSecret('clerkSecretKey');
const clerkPublishableKey = config.require('clerkPublishableKey');

// CORS configuration - comma-separated list of allowed origins (optional)
// If not set, API allows all origins (safe when behind CloudFront)
const frontendUrl = config.get('frontendUrl');

// Naming convention
const namePrefix = `soccer-stats-api-${stack}`;

// =============================================================================
// Import Shared Infrastructure
// =============================================================================
const sharedInfra = getSharedInfraStackReference();

// Import outputs from shared infrastructure stack
const clusterArn = sharedInfra.requireOutput('clusterArn');
const ecsSecurityGroupId = sharedInfra.requireOutput('ecsSecurityGroupId');
const privateSubnetIds = sharedInfra.requireOutput('privateSubnetIds');
const publicSubnetIds = sharedInfra.requireOutput('publicSubnetIds');
const apiTargetGroupArn = sharedInfra.requireOutput('apiTargetGroupArn');
const taskExecutionRoleArn = sharedInfra.requireOutput('taskExecutionRoleArn');
const taskRoleArn = sharedInfra.requireOutput('taskRoleArn');
const logGroupName = sharedInfra.requireOutput('logGroupName');
const ecrRepositoryUrl = sharedInfra.requireOutput('ecrRepositoryUrl');
const albDnsName = sharedInfra.requireOutput('albDnsName');
const databaseSecretArn = sharedInfra.requireOutput('databaseSecretArn');

// =============================================================================
// Clerk Secrets
// =============================================================================
// Store Clerk credentials in Secrets Manager for secure access by ECS
const clerkSecret = new aws.secretsmanager.Secret(`${namePrefix}-clerk`, {
  name: `soccer-stats-${stack}/clerk`,
  description: 'Clerk authentication credentials for soccer-stats API',
  tags: {
    Name: `${namePrefix}-clerk`,
    Environment: stack,
  },
});

const clerkSecretVersion = new aws.secretsmanager.SecretVersion(
  `${namePrefix}-clerk-version`,
  {
    secretId: clerkSecret.id,
    secretString: pulumi
      .all([clerkSecretKey, clerkPublishableKey])
      .apply(([secretKey, publishableKey]) =>
        JSON.stringify({
          secretKey,
          publishableKey,
        }),
      ),
  },
);

// Grant task execution role access to the Clerk secret
const clerkSecretPolicy = new aws.iam.RolePolicy(
  `${namePrefix}-clerk-secret-policy`,
  {
    role: taskExecutionRoleArn.apply((arn) => arn.split('/').pop()!),
    policy: clerkSecret.arn.apply((secretArn) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: secretArn,
          },
        ],
      }),
    ),
  },
);

// =============================================================================
// Build and Push Docker Image
// =============================================================================
// Get current AWS region for ECR auth
const currentRegion = aws.getRegionOutput();

// Git SHA for immutable image tags (from CI or local fallback)
const gitSha = process.env.GITHUB_SHA?.substring(0, 7) || 'local';

// Tag strategy:
// - Non-prod stacks: :dev, :staging + :abc123 (git sha)
// - Prod/main: :latest + :abc123 (git sha)
const imageTags =
  stack === 'prod'
    ? [
        pulumi.interpolate`${ecrRepositoryUrl}:latest`,
        pulumi.interpolate`${ecrRepositoryUrl}:${gitSha}`,
      ]
    : [
        pulumi.interpolate`${ecrRepositoryUrl}:${stack}`,
        pulumi.interpolate`${ecrRepositoryUrl}:${gitSha}`,
      ];

const image = new docker.Image(`${namePrefix}-image`, {
  // Build context is the monorepo root
  context: {
    location: '../../../../', // From api-infra to repo root
  },
  dockerfile: {
    location: '../../../../apps/soccer-stats/api/Dockerfile',
  },
  platforms: ['linux/amd64'],
  tags: imageTags,
  push: true,
  registries: [
    {
      address: ecrRepositoryUrl,
      username: 'AWS',
      password: pulumi.secret(aws.ecr.getAuthorizationTokenOutput().password),
    },
  ],
  // Build args if needed
  buildArgs: {
    NODE_ENV: 'production',
  },
  // Cache configuration for faster builds
  // Using inline cache which is more compatible with ECR
  // Registry cache can fail on first push when cache layers don't exist yet
  cacheFrom: [
    {
      registry: {
        ref: pulumi.interpolate`${ecrRepositoryUrl}:${stack}`,
      },
    },
  ],
  cacheTo: [
    {
      inline: {},
    },
  ],
});

// =============================================================================
// ECS Task Definition
// =============================================================================
const taskDefinition = new aws.ecs.TaskDefinition(`${namePrefix}-task`, {
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
        {
          name: 'api',
          image: imageRef,
          essential: true,
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
            // Database credentials from AWS Secrets Manager (managed by shared infrastructure)
            // The app expects individual DB_* variables, not a single DATABASE_URL
            {
              name: 'DB_HOST',
              valueFrom: `${dbSecretArn}:host::`,
            },
            {
              name: 'DB_PORT',
              valueFrom: `${dbSecretArn}:port::`,
            },
            {
              name: 'DB_USERNAME',
              valueFrom: `${dbSecretArn}:username::`,
            },
            {
              name: 'DB_PASSWORD',
              valueFrom: `${dbSecretArn}:password::`,
            },
            {
              name: 'DB_NAME',
              valueFrom: `${dbSecretArn}:database::`,
            },
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

const service = new aws.ecs.Service(`${namePrefix}-service`, {
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

// =============================================================================
// Auto Scaling
// =============================================================================
// Scale based on CPU utilization to handle weekend usage spikes
// Min: 1 task (cost savings during quiet periods)
// Max: 4 tasks (handle spikes without breaking the bank on Spot)

const scalingTarget = new aws.appautoscaling.Target(
  `${namePrefix}-scaling-target`,
  {
    maxCapacity: maxCapacity,
    minCapacity: minCapacity,
    resourceId: pulumi.interpolate`service/${clusterArn.apply((arn) => arn.split('/').pop())}/${service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
    tags: {
      Name: `${namePrefix}-scaling-target`,
      Environment: stack,
    },
  },
);

// Target tracking policy: Scale to maintain target CPU utilization
const cpuScalingPolicy = new aws.appautoscaling.Policy(
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
