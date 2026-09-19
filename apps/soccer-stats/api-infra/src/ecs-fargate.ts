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
  publicSubnetIds,
  privateSubnetIds,
  vpcId,
  albSecurityGroupId,
  fargateSecurityGroupId,
  ecsTaskExecutionRoleArn,
  ecsTaskRoleArn,
  databaseUrlSecretArn,
  originVerifySecret,
} from './shared-infra';
import { clerkSecretKeySecretArn } from './secrets';
import { apiVersion, buildTime, gitSha, image } from './docker';

// =============================================================================
// Load Balancer
// =============================================================================
// Internet-facing (required so CloudFront's custom origin can reach it) but
// locked down to CloudFront's IP ranges only via the ALB security group
// (see security-groups.ts) — direct requests that bypass CloudFront are
// rejected at the network layer. HTTP-only: CloudFront terminates TLS at
// the edge and talks plain HTTP to this ALB over the AWS backbone, which
// avoids needing an ACM certificate + custom domain on the ALB itself.
export const alb = new aws.lb.LoadBalancer(`${namePrefix}-alb`, {
  name: `${namePrefix}-alb`.slice(0, 32),
  loadBalancerType: 'application',
  subnets: publicSubnetIds,
  securityGroups: [albSecurityGroupId],
  // Generous idle timeout — GraphQL WebSocket subscriptions can sit idle
  // between game events for long stretches. Paired with a graphql-ws
  // keepAlive ping (see app.module.ts) that resets this timer periodically.
  idleTimeout: 120,
  tags: { Name: `${namePrefix}-alb`, Environment: stack },
});

export const targetGroup = new aws.lb.TargetGroup(`${namePrefix}-tg`, {
  name: `${namePrefix}-tg`.slice(0, 32),
  port: containerPort,
  protocol: 'HTTP',
  targetType: 'ip', // required for Fargate awsvpc networking
  vpcId,
  healthCheck: {
    path: '/api/health',
    protocol: 'HTTP',
    matcher: '200',
    interval: 10,
    timeout: 5,
    healthyThreshold: 2,
    // Covers Aurora cold start (15-40s) + migrations, matching the old
    // App Runner health check's generous unhealthy threshold.
    unhealthyThreshold: 10,
  },
  // WebSocket connections are long-lived; deregister slowly so in-flight
  // subscriptions get a chance to reconnect elsewhere during deploys.
  deregistrationDelay: 30,
  tags: { Name: `${namePrefix}-tg`, Environment: stack },
});

// Custom header name CloudFront attaches to origin requests (value is the
// `originVerifySecret` shared-infra output) — must match
// apps/soccer-stats/ui-infra/src/cloudfront.ts's customHeaders entry.
// The security group already restricts inbound traffic to CloudFront's IP
// ranges (see security-groups.ts), but that alone isn't sufficient: those
// ranges are shared across every CloudFront distribution on AWS, so anyone
// else's distribution could be pointed at this ALB as a custom origin and
// bypass the intended access path. Requiring this header (which only our
// CloudFront distribution knows) closes that gap.
const ORIGIN_VERIFY_HEADER_NAME = 'X-Origin-Verify';

export const httpListener = new aws.lb.Listener(`${namePrefix}-listener`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: 'HTTP',
  // Deny by default — only the rule below (matching the verify header) forwards.
  defaultActions: [
    {
      type: 'fixed-response',
      fixedResponse: {
        contentType: 'text/plain',
        messageBody: 'Forbidden',
        statusCode: '403',
      },
    },
  ],
});

new aws.lb.ListenerRule(`${namePrefix}-listener-rule`, {
  listenerArn: httpListener.arn,
  priority: 1,
  actions: [
    {
      type: 'forward',
      targetGroupArn: targetGroup.arn,
    },
  ],
  conditions: [
    {
      httpHeader: {
        httpHeaderName: ORIGIN_VERIFY_HEADER_NAME,
        values: [originVerifySecret],
      },
    },
  ],
});

// =============================================================================
// ECS Cluster, Logs, Task Definition, Service
// =============================================================================
export const cluster = new aws.ecs.Cluster(`${namePrefix}-cluster`, {
  name: `${namePrefix}-cluster`,
  tags: { Name: `${namePrefix}-cluster`, Environment: stack },
});

export const logGroup = new aws.cloudwatch.LogGroup(`${namePrefix}-logs`, {
  name: `/ecs/${namePrefix}`,
  retentionInDays: 7,
  tags: { Name: `${namePrefix}-logs`, Environment: stack },
});

const containerName = 'api';

export const taskDefinition = new aws.ecs.TaskDefinition(
  `${namePrefix}-task`,
  {
    family: namePrefix,
    cpu: '256', // 0.25 vCPU — matches the old App Runner instance configuration
    memory: '512', // 0.5 GB
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    executionRoleArn: ecsTaskExecutionRoleArn,
    taskRoleArn: ecsTaskRoleArn,
    containerDefinitions: pulumi
      .all([
        ecrRepositoryUrl,
        gitSha,
        logGroup.name,
        aws.getRegionOutput().name,
        databaseUrlSecretArn,
        clerkSecretKeySecretArn,
      ])
      .apply(([repoUrl, sha, logGroupName, region, dbUrlArn, clerkArn]) =>
        JSON.stringify([
          {
            name: containerName,
            image: `${repoUrl}:${sha}`,
            essential: true,
            portMappings: [
              {
                containerPort,
                protocol: 'tcp',
              },
            ],
            environment: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'APP_VERSION', value: apiVersion },
              { name: 'GIT_SHA', value: sha },
              { name: 'BUILD_TIME', value: buildTime },
              { name: 'PORT', value: containerPort.toString() },
              { name: 'CONTAINER_MEMORY_LIMIT_MB', value: '512' },
              { name: 'DB_SYNCHRONIZE', value: 'false' },
              { name: 'DB_POOL_MAX', value: dbPoolMax.toString() },
              { name: 'DB_POOL_MIN', value: dbPoolMin.toString() },
              {
                name: 'DB_POOL_IDLE_TIMEOUT',
                value: dbPoolIdleTimeout.toString(),
              },
              {
                name: 'DB_POOL_CONNECTION_TIMEOUT',
                value: dbPoolConnectionTimeout.toString(),
              },
              { name: 'DB_SSL', value: 'true' },
              { name: 'NO_COLOR', value: 'true' },
              { name: 'LOG_FORMAT', value: 'json' },
              {
                name: 'OBSERVABILITY_LOG_LEVEL',
                value: observabilityLogLevel,
              },
              {
                name: 'SLOW_QUERY_THRESHOLD_MS',
                value: slowQueryThresholdMs.toString(),
              },
              {
                name: 'QUERY_COMPLEXITY_LIMIT',
                value: queryComplexityLimit.toString(),
              },
              {
                name: 'DATALOADER_BATCH_SIZE_WARNING',
                value: dataLoaderBatchSizeWarning.toString(),
              },
              { name: 'CLERK_PUBLISHABLE_KEY', value: clerkPublishableKey },
              ...(frontendUrl
                ? [{ name: 'FRONTEND_URL', value: frontendUrl }]
                : []),
            ],
            secrets: [
              { name: 'DATABASE_URL', valueFrom: dbUrlArn },
              { name: 'CLERK_SECRET_KEY', valueFrom: clerkArn },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'api',
              },
            },
          },
        ]),
      ),
    tags: { Name: `${namePrefix}-task`, Environment: stack },
  },
  { dependsOn: [image] },
);

export const service = new aws.ecs.Service(
  `${namePrefix}-service`,
  {
    name: `${namePrefix}-service`,
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 1,
    launchType: 'FARGATE',
    networkConfiguration: {
      subnets: privateSubnetIds,
      securityGroups: [fargateSecurityGroupId],
      assignPublicIp: false,
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName,
        containerPort,
      },
    ],
    // Covers Aurora cold start + migrations before the health check can fail the deployment
    healthCheckGracePeriodSeconds: 200,
    deploymentMinimumHealthyPercent: 100,
    deploymentMaximumPercent: 200,
    tags: { Name: `${namePrefix}-service`, Environment: stack },
  },
  { dependsOn: [httpListener] },
);

// Deliberately no auto-scaling beyond the single fixed task above: the
// GraphQL PubSub is in-memory and single-process (see
// apps/soccer-stats/api/docs/SUBSCRIPTIONS.md). Running 2+ tasks would
// silently reintroduce cross-instance real-time gaps (a client subscribed
// via one task would never see an event published via another). Migrate to
// a Redis-backed PubSub (documented in that file) before scaling out.

// Hostname only (no protocol) — used as the CloudFront API origin, matching
// the shape the old App Runner `serviceUrl` output had.
export const serviceUrl = alb.dnsName;
export const serviceArn = service.arn;
