# App Runner + Aurora Serverless v2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ECS Fargate + ALB with AWS App Runner and Standard RDS with Aurora Serverless v2 (min 0 ACU) to reduce hosting cost from ~$52/month to ~$11–16/month.

**Architecture:** App Runner pulls the NestJS container image from ECR and routes traffic without a load balancer. A VPC Connector bridges App Runner's managed network into the VPC where Aurora Serverless v2 lives. A t4g.nano bastion EC2 provides SSM-based port forwarding for local DB access. Migrations run during NestJS bootstrap before the health check passes.

**Tech Stack:** AWS App Runner, Aurora Serverless v2, AWS SSM Session Manager, Pulumi (`@pulumi/aws`), NestJS, TypeORM

---

## File Map

**Created:**

- `libs/soccer-stats/infra/src/lib/modules/vpc-connector.ts` — App Runner VPC Connector resource
- `libs/soccer-stats/infra/src/lib/modules/bastion.ts` — SSM-enabled t4g.nano bastion EC2
- `apps/soccer-stats/api-infra/src/app-runner.ts` — App Runner service definition
- `scripts/db-tunnel.sh` — SSM port-forward helper script

**Modified:**

- `libs/soccer-stats/infra/src/lib/types.ts` — Remove ECS/ALB/logging outputs; add App Runner + bastion outputs
- `libs/soccer-stats/infra/src/lib/modules/iam.ts` — Replace ECS roles with App Runner access + instance roles
- `libs/soccer-stats/infra/src/lib/modules/security-groups.ts` — Replace ALB/ECS SGs with App Runner connector + bastion SGs
- `libs/soccer-stats/infra/src/lib/modules/database.ts` — Add plain-string `DATABASE_URL` Secrets Manager secret
- `libs/soccer-stats/infra/src/lib/modules/index.ts` — Export new modules, remove deleted ones
- `libs/soccer-stats/infra/src/lib/shared-infrastructure.ts` — Wire new modules, remove ECS/ALB/logging
- `apps/soccer-stats/api-infra/src/config.ts` — Remove ECS-specific config
- `apps/soccer-stats/api-infra/src/shared-infra.ts` — Pull new stack reference outputs
- `apps/soccer-stats/api-infra/src/secrets.ts` — Replace JSON Clerk secret with plain-string `CLERK_SECRET_KEY` secret
- `apps/soccer-stats/api-infra/src/index.ts` — Export App Runner service URL instead of ECS ARNs
- `apps/soccer-stats/api-infra/Pulumi.dev.yaml` — Remove ECS config; increase `dbPoolConnectionTimeout` to 45000
- `apps/soccer-stats/api/src/app/environment.ts` — Add `getDatabaseUrl()`
- `apps/soccer-stats/api/src/database/typeorm.config.ts` — Use `url` when `DATABASE_URL` is set; add `migrations` array
- `apps/soccer-stats/api/src/main.ts` — Run `dataSource.runMigrations()` before `app.listen()`

**Deleted:**

- `libs/soccer-stats/infra/src/lib/modules/ecs.ts`
- `libs/soccer-stats/infra/src/lib/modules/load-balancer.ts`
- `libs/soccer-stats/infra/src/lib/modules/logging.ts`
- `apps/soccer-stats/api-infra/src/ecs.ts`
- `apps/soccer-stats/api-infra/src/autoscaling.ts`

---

## Task 1: Update Shared Infra Types

**Files:**

- Modify: `libs/soccer-stats/infra/src/lib/types.ts`

- [ ] **Step 1: Replace the contents of `types.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';

export interface SharedInfraOutputs {
  // VPC
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;

  // Security Groups
  appRunnerConnectorSecurityGroupId: pulumi.Output<string>;
  rdsSecurityGroupId: pulumi.Output<string>;

  // App Runner networking
  vpcConnectorArn: pulumi.Output<string>;

  // IAM
  appRunnerAccessRoleArn: pulumi.Output<string>;
  appRunnerInstanceRoleArn: pulumi.Output<string>;

  // ECR
  ecrRepositoryUrl: pulumi.Output<string>;
  ecrRepositoryArn: pulumi.Output<string>;

  // Database
  databaseEndpoint: pulumi.Output<string>;
  databasePort: pulumi.Output<number>;
  databaseName: string;
  databaseUsername: string;
  databaseSecretArn: pulumi.Output<string>;
  databaseUrlSecretArn: pulumi.Output<string>;

  // Bastion
  bastionInstanceId: pulumi.Output<string>;

  // Convenience
  environment: string;
  region: pulumi.Output<string>;
}

export interface SharedInfraConfig {
  vpcCidr?: string;
  azCount?: number;
  enableNatGateway?: boolean;
  containerPort?: number;
  databaseName?: string;
  databaseUsername?: string;
  /** Min Aurora ACU (default: 0 — scale to zero) */
  databaseMinCapacity?: number;
  /** Max Aurora ACU (default: 4) */
  databaseMaxCapacity?: number;
}
```

- [ ] **Step 2: Build the infra library to verify types compile**

```bash
pnpm nx build soccer-stats-infra
```

Expected: build succeeds (there will be TS errors in `shared-infrastructure.ts` referencing removed fields — that's expected and fixed in Task 7).

- [ ] **Step 3: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/types.ts
git commit -m "refactor(infra): update SharedInfraOutputs for App Runner migration"
```

---

## Task 2: Replace IAM Module

**Files:**

- Modify: `libs/soccer-stats/infra/src/lib/modules/iam.ts`

- [ ] **Step 1: Replace the entire contents of `iam.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface IamOutputs {
  appRunnerAccessRole: aws.iam.Role;
  appRunnerInstanceRole: aws.iam.Role;
  appRunnerAccessRoleArn: pulumi.Output<string>;
  appRunnerInstanceRoleArn: pulumi.Output<string>;
}

/** Creates IAM roles for App Runner image pull (access role) and runtime (instance role). */
export function createIamRoles(config: IamConfig): IamOutputs {
  const { namePrefix, stack, awsProvider } = config;

  // Access role — used by App Runner build service to pull images from ECR
  const appRunnerAccessRole = new aws.iam.Role(
    `${namePrefix}-apprunner-access-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'build.apprunner.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-apprunner-access-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-apprunner-ecr-policy`,
    {
      role: appRunnerAccessRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess',
    },
    { provider: awsProvider },
  );

  // Instance role — used by the running container to call AWS APIs
  const appRunnerInstanceRole = new aws.iam.Role(
    `${namePrefix}-apprunner-instance-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'tasks.apprunner.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-apprunner-instance-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    appRunnerAccessRole,
    appRunnerInstanceRole,
    appRunnerAccessRoleArn: appRunnerAccessRole.arn,
    appRunnerInstanceRoleArn: appRunnerInstanceRole.arn,
  };
}

/**
 * Grants the App Runner instance role permission to read a Secrets Manager secret.
 * Call once per secret that the running container needs to access.
 */
export function grantSecretAccess(namePrefix: string, instanceRole: aws.iam.Role, secretArn: pulumi.Output<string>, awsProvider: aws.Provider, suffix: string): void {
  new aws.iam.RolePolicy(
    `${namePrefix}-secret-access-${suffix}`,
    {
      role: instanceRole.name,
      policy: secretArn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: [arn],
            },
          ],
        }),
      ),
    },
    { provider: awsProvider },
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/modules/iam.ts
git commit -m "refactor(infra): replace ECS IAM roles with App Runner access and instance roles"
```

---

## Task 3: Add VPC Connector and Bastion Modules

**Files:**

- Create: `libs/soccer-stats/infra/src/lib/modules/vpc-connector.ts`
- Create: `libs/soccer-stats/infra/src/lib/modules/bastion.ts`

- [ ] **Step 1: Create `vpc-connector.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcConnectorConfig {
  namePrefix: string;
  stack: string;
  privateSubnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface VpcConnectorOutputs {
  vpcConnector: aws.apprunner.VpcConnector;
  vpcConnectorArn: pulumi.Output<string>;
}

/** Creates an App Runner VPC Connector so the service can reach Aurora in private subnets. */
export function createVpcConnector(config: VpcConnectorConfig): VpcConnectorOutputs {
  const { namePrefix, stack, privateSubnetIds, securityGroupId, awsProvider } = config;

  const vpcConnector = new aws.apprunner.VpcConnector(
    `${namePrefix}-vpc-connector`,
    {
      vpcConnectorName: `${namePrefix}-connector`,
      subnets: privateSubnetIds,
      securityGroups: [securityGroupId],
      tags: { Name: `${namePrefix}-vpc-connector`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    vpcConnector,
    vpcConnectorArn: vpcConnector.arn,
  };
}
```

- [ ] **Step 2: Create `bastion.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BastionConfig {
  namePrefix: string;
  stack: string;
  publicSubnetIds: pulumi.Output<string[]>;
  bastionSecurityGroupId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface BastionOutputs {
  instance: aws.ec2.Instance;
  instanceId: pulumi.Output<string>;
}

/** Creates a t4g.nano EC2 bastion with SSM agent for SSM port-forward tunnels to Aurora. */
export function createBastion(config: BastionConfig): BastionOutputs {
  const { namePrefix, stack, publicSubnetIds, bastionSecurityGroupId, awsProvider } = config;

  // SSM instance profile — grants Systems Manager access with no SSH keys required
  const bastionRole = new aws.iam.Role(
    `${namePrefix}-bastion-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'ec2.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { Name: `${namePrefix}-bastion-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-bastion-ssm-policy`,
    {
      role: bastionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    },
    { provider: awsProvider },
  );

  const bastionInstanceProfile = new aws.iam.InstanceProfile(`${namePrefix}-bastion-profile`, { role: bastionRole.name }, { provider: awsProvider });

  // Amazon Linux 2023 ARM64 (us-west-2) — t4g requires ARM64
  const ami = aws.ec2.getAmiOutput(
    {
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['al2023-ami-*-arm64'] },
        { name: 'state', values: ['available'] },
      ],
    },
    { provider: awsProvider },
  );

  const instance = new aws.ec2.Instance(
    `${namePrefix}-bastion`,
    {
      ami: ami.id,
      instanceType: 't4g.nano',
      subnetId: publicSubnetIds.apply((ids) => ids[0]),
      vpcSecurityGroupIds: [bastionSecurityGroupId],
      iamInstanceProfile: bastionInstanceProfile.name,
      associatePublicIpAddress: true,
      tags: { Name: `${namePrefix}-bastion`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    instance,
    instanceId: instance.id,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/modules/vpc-connector.ts libs/soccer-stats/infra/src/lib/modules/bastion.ts
git commit -m "feat(infra): add App Runner VPC Connector and SSM bastion modules"
```

---

## Task 4: Update Security Groups Module

**Files:**

- Modify: `libs/soccer-stats/infra/src/lib/modules/security-groups.ts`

- [ ] **Step 1: Replace the entire contents of `security-groups.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupsConfig {
  namePrefix: string;
  stack: string;
  vpcId: pulumi.Output<string>;
  awsProvider: aws.Provider;
}

export interface SecurityGroupsOutputs {
  appRunnerConnectorSecurityGroup: aws.ec2.SecurityGroup;
  bastionSecurityGroup: aws.ec2.SecurityGroup;
  rdsSecurityGroup: aws.ec2.SecurityGroup;
}

/** Creates security groups for App Runner VPC Connector, bastion, and Aurora. */
export function createSecurityGroups(config: SecurityGroupsConfig): SecurityGroupsOutputs {
  const { namePrefix, stack, vpcId, awsProvider } = config;

  // App Runner VPC Connector SG — outbound to Aurora only
  const appRunnerConnectorSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-apprunner-connector-sg`,
    {
      vpcId,
      description: 'Security group for App Runner VPC Connector — egress to Aurora',
      egress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow PostgreSQL outbound to Aurora',
        },
      ],
      tags: { Name: `${namePrefix}-apprunner-connector-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Bastion SG — no inbound (SSM connects without open ports), outbound to Aurora + internet for SSM
  const bastionSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-bastion-sg`,
    {
      vpcId,
      description: 'Security group for SSM bastion — no inbound, outbound to Aurora and internet',
      egress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow PostgreSQL outbound to Aurora',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS for SSM agent communication',
        },
      ],
      tags: { Name: `${namePrefix}-bastion-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // RDS SG — inbound from App Runner connector and bastion only
  const rdsSecurityGroup = new aws.ec2.SecurityGroup(
    `${namePrefix}-rds-sg`,
    {
      vpcId,
      description: 'Security group for Aurora — ingress from App Runner connector and bastion',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [appRunnerConnectorSecurityGroup.id],
          description: 'Allow PostgreSQL from App Runner VPC Connector',
        },
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [bastionSecurityGroup.id],
          description: 'Allow PostgreSQL from bastion for local dev access',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: { Name: `${namePrefix}-rds-sg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    appRunnerConnectorSecurityGroup,
    bastionSecurityGroup,
    rdsSecurityGroup,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/modules/security-groups.ts
git commit -m "refactor(infra): replace ALB/ECS security groups with App Runner connector and bastion groups"
```

---

## Task 5: Update Database Module — Add URL Secret

**Files:**

- Modify: `libs/soccer-stats/infra/src/lib/modules/database.ts`

- [ ] **Step 1: Find the `DatabaseOutputs` interface (line ~28) and add `databaseUrlSecretArn`**

Replace:

```typescript
export interface DatabaseOutputs {
  dbEndpoint: pulumi.Output<string>;
  dbPort: pulumi.Output<number>;
  dbSecret: aws.secretsmanager.Secret;
  databaseName: string;
  databaseUsername: string;
  databaseSecretArn: pulumi.Output<string>;
}
```

With:

```typescript
export interface DatabaseOutputs {
  dbEndpoint: pulumi.Output<string>;
  dbPort: pulumi.Output<number>;
  dbSecret: aws.secretsmanager.Secret;
  databaseName: string;
  databaseUsername: string;
  databaseSecretArn: pulumi.Output<string>;
  databaseUrlSecretArn: pulumi.Output<string>;
}
```

- [ ] **Step 2: In `createDatabase()`, add the URL secret after the `_dbSecretVersion` block (around line 122) and update the return value**

After the `_dbSecretVersion` declaration, add:

```typescript
// Plain-string secret containing just the PostgreSQL connection URL.
// App Runner cannot extract individual JSON fields from Secrets Manager,
// so this separate secret lets App Runner set DATABASE_URL directly.
const dbUrlSecret = new aws.secretsmanager.Secret(
  `${namePrefix}-db-url-secret`,
  {
    name: `${namePrefix}/database-url`,
    description: `PostgreSQL connection URL for ${namePrefix} (used by App Runner)`,
    tags: { Name: `${namePrefix}-db-url-secret`, Environment: stack },
  },
  { provider: awsProvider },
);

new aws.secretsmanager.SecretVersion(
  `${namePrefix}-db-url-secret-version`,
  {
    secretId: dbUrlSecret.id,
    secretString: pulumi.all([dbEndpoint, dbPort, dbPassword.result]).apply(([endpoint, port, password]) => `postgresql://${dbUsername}:${encodeURIComponent(password)}@${endpoint}:${port}/${dbName}?sslmode=require`),
  },
  { provider: awsProvider },
);
```

Then update the return statement:

```typescript
return {
  dbEndpoint,
  dbPort,
  dbSecret,
  databaseName: dbName,
  databaseUsername: dbUsername,
  databaseSecretArn: dbSecret.arn,
  databaseUrlSecretArn: dbUrlSecret.arn,
};
```

- [ ] **Step 3: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/modules/database.ts
git commit -m "feat(infra): add plain-string DATABASE_URL secret for App Runner compatibility"
```

---

## Task 6: Update Modules Index and Delete Removed Modules

**Files:**

- Modify: `libs/soccer-stats/infra/src/lib/modules/index.ts`
- Delete: `libs/soccer-stats/infra/src/lib/modules/ecs.ts`
- Delete: `libs/soccer-stats/infra/src/lib/modules/load-balancer.ts`
- Delete: `libs/soccer-stats/infra/src/lib/modules/logging.ts`

- [ ] **Step 1: Replace the contents of `index.ts`**

```typescript
export { createVpc, type VpcConfig, type VpcOutputs } from './vpc';
export { createSecurityGroups, type SecurityGroupsConfig, type SecurityGroupsOutputs } from './security-groups';
export { createVpcConnector, type VpcConnectorConfig, type VpcConnectorOutputs } from './vpc-connector';
export { createBastion, type BastionConfig, type BastionOutputs } from './bastion';
export { createEcrRepository, type EcrConfig, type EcrOutputs } from './ecr';
export { createIamRoles, grantSecretAccess, type IamConfig, type IamOutputs } from './iam';
export { createDatabase, type DatabaseConfig, type DatabaseOutputs } from './database';
```

- [ ] **Step 2: Delete the removed module files**

```bash
rm libs/soccer-stats/infra/src/lib/modules/ecs.ts
rm libs/soccer-stats/infra/src/lib/modules/load-balancer.ts
rm libs/soccer-stats/infra/src/lib/modules/logging.ts
```

- [ ] **Step 3: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/modules/index.ts
git rm libs/soccer-stats/infra/src/lib/modules/ecs.ts libs/soccer-stats/infra/src/lib/modules/load-balancer.ts libs/soccer-stats/infra/src/lib/modules/logging.ts
git commit -m "refactor(infra): remove ECS, ALB, and logging modules; export App Runner modules"
```

---

## Task 7: Rewrite shared-infrastructure.ts

**Files:**

- Modify: `libs/soccer-stats/infra/src/lib/shared-infrastructure.ts`

- [ ] **Step 1: Replace the entire contents of `shared-infrastructure.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { SharedInfraConfig, SharedInfraOutputs } from './types';
import { createVpc, createSecurityGroups, createVpcConnector, createBastion, createEcrRepository, createIamRoles, grantSecretAccess, createDatabase } from './modules';

/**
 * Creates shared AWS infrastructure for the soccer-stats application.
 * Includes VPC, App Runner networking, Aurora Serverless v2, ECR, IAM, and bastion.
 */
export function createSharedInfrastructure(config: SharedInfraConfig = {}): SharedInfraOutputs {
  const stack = pulumi.getStack();

  const vpcCidr = config.vpcCidr || '10.0.0.0/16';
  const azCount = config.azCount || 2;
  const enableNatGateway = config.enableNatGateway ?? false;
  const dbName = config.databaseName || 'soccer_stats';
  const dbUsername = config.databaseUsername || 'postgres';
  const dbMinCapacity = config.databaseMinCapacity ?? 0;
  const dbMaxCapacity = config.databaseMaxCapacity || 4;
  const namePrefix = `soccer-stats-${stack}`;

  const awsProvider = new aws.Provider(`${namePrefix}-aws-provider`, {
    region: aws.config.region,
  });

  const vpc = createVpc({
    namePrefix,
    stack,
    vpcCidr,
    azCount,
    enableNatGateway,
    awsProvider,
  });

  const securityGroups = createSecurityGroups({
    namePrefix,
    stack,
    vpcId: vpc.vpcId,
    awsProvider,
  });

  const vpcConnector = createVpcConnector({
    namePrefix,
    stack,
    privateSubnetIds: vpc.privateSubnetIds,
    securityGroupId: securityGroups.appRunnerConnectorSecurityGroup.id,
    awsProvider,
  });

  const bastion = createBastion({
    namePrefix,
    stack,
    publicSubnetIds: vpc.publicSubnetIds,
    bastionSecurityGroupId: securityGroups.bastionSecurityGroup.id,
    awsProvider,
  });

  const ecr = createEcrRepository({ namePrefix, stack, awsProvider });

  const iam = createIamRoles({ namePrefix, stack, awsProvider });

  const database = createDatabase({
    namePrefix,
    stack,
    privateSubnetIds: vpc.privateSubnetIds,
    publicSubnetIds: vpc.publicSubnetIds,
    rdsSecurityGroupId: securityGroups.rdsSecurityGroup.id,
    dbName,
    dbUsername,
    useAurora: true,
    dbInstanceClass: 'db.t3.micro',
    dbMinCapacity,
    dbMaxCapacity,
    awsProvider,
    publiclyAccessible: false,
  });

  // Grant instance role access to both database secrets
  grantSecretAccess(namePrefix, iam.appRunnerInstanceRole, database.databaseSecretArn, awsProvider, 'db');
  grantSecretAccess(namePrefix, iam.appRunnerInstanceRole, database.databaseUrlSecretArn, awsProvider, 'db-url');

  return {
    vpcId: vpc.vpcId,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,
    appRunnerConnectorSecurityGroupId: securityGroups.appRunnerConnectorSecurityGroup.id,
    rdsSecurityGroupId: securityGroups.rdsSecurityGroup.id,
    vpcConnectorArn: vpcConnector.vpcConnectorArn,
    appRunnerAccessRoleArn: iam.appRunnerAccessRoleArn,
    appRunnerInstanceRoleArn: iam.appRunnerInstanceRoleArn,
    ecrRepositoryUrl: ecr.repositoryUrl,
    ecrRepositoryArn: ecr.repositoryArn,
    databaseEndpoint: database.dbEndpoint,
    databasePort: database.dbPort,
    databaseName: database.databaseName,
    databaseUsername: database.databaseUsername,
    databaseSecretArn: database.databaseSecretArn,
    databaseUrlSecretArn: database.databaseUrlSecretArn,
    bastionInstanceId: bastion.instanceId,
    environment: stack,
    region: pulumi.output(aws.config.region || 'us-west-2'),
  };
}
```

- [ ] **Step 2: Build the infra library**

```bash
pnpm nx build soccer-stats-infra
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add libs/soccer-stats/infra/src/lib/shared-infrastructure.ts
git commit -m "refactor(infra): wire App Runner, Aurora, bastion; remove ECS/ALB/logging"
```

---

## Task 8: Update api-infra Config and Stack Reference

**Files:**

- Modify: `apps/soccer-stats/api-infra/src/config.ts`
- Modify: `apps/soccer-stats/api-infra/src/shared-infra.ts`

- [ ] **Step 1: Replace `config.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const stack = pulumi.getStack();

export const containerPort = config.getNumber('containerPort') || 3333;

// Clerk authentication (required)
export const clerkSecretKey = config.requireSecret('clerkSecretKey');
export const clerkPublishableKey = config.require('clerkPublishableKey');

// CORS configuration
export const frontendUrl = config.get('frontendUrl');

// Database connection pool configuration
export const dbPoolMax = config.getNumber('dbPoolMax') || 10;
export const dbPoolMin = config.getNumber('dbPoolMin') || 2;
export const dbPoolIdleTimeout = config.getNumber('dbPoolIdleTimeout') || 30000;
export const dbPoolConnectionTimeout = config.getNumber('dbPoolConnectionTimeout') || 45000;

// Observability configuration
export const observabilityLogLevel = config.get('observabilityLogLevel') || 'none';
export const slowQueryThresholdMs = config.getNumber('slowQueryThresholdMs') || 1000;
export const queryComplexityLimit = config.getNumber('queryComplexityLimit') || 100;
export const dataLoaderBatchSizeWarning = config.getNumber('dataLoaderBatchSizeWarning') || 100;

export const namePrefix = `soccer-stats-api-${stack}`;
```

- [ ] **Step 2: Replace `shared-infra.ts`**

```typescript
import { getSharedInfraStackReference } from './stack-reference';

const sharedInfra = getSharedInfraStackReference();

export const ecrRepositoryUrl = sharedInfra.requireOutput('ecrRepositoryUrl');
export const vpcConnectorArn = sharedInfra.requireOutput('vpcConnectorArn');
export const appRunnerAccessRoleArn = sharedInfra.requireOutput('appRunnerAccessRoleArn');
export const appRunnerInstanceRoleArn = sharedInfra.requireOutput('appRunnerInstanceRoleArn');
export const databaseUrlSecretArn = sharedInfra.requireOutput('databaseUrlSecretArn');
export const databaseSecretArn = sharedInfra.requireOutput('databaseSecretArn');
```

- [ ] **Step 3: Update `stack-reference.ts` to use the new SharedInfraOutputs type**

In `apps/soccer-stats/api-infra/src/stack-reference.ts`, the file already imports `SharedInfraOutputs` from `@garage/soccer-stats/infra` — no change needed if the type is updated (Task 1 handles that). Verify it still compiles after the type change.

- [ ] **Step 4: Commit**

```bash
git add apps/soccer-stats/api-infra/src/config.ts apps/soccer-stats/api-infra/src/shared-infra.ts
git commit -m "refactor(api-infra): remove ECS config; update stack reference outputs for App Runner"
```

---

## Task 9: Update api-infra Secrets

**Files:**

- Modify: `apps/soccer-stats/api-infra/src/secrets.ts`

App Runner can't extract JSON fields from secrets, so we store `CLERK_SECRET_KEY` as a plain string secret. `CLERK_PUBLISHABLE_KEY` is a public key (safe as a plain env var).

- [ ] **Step 1: Replace `secrets.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { namePrefix, stack, clerkSecretKey } from './config';
import { appRunnerInstanceRoleArn } from './shared-infra';

// Store Clerk secret key as a plain string (not JSON) so App Runner can inject it directly
export const clerkSecretKeySecret = new aws.secretsmanager.Secret(`${namePrefix}-clerk-secret-key`, {
  name: `soccer-stats-${stack}/clerk-secret-key`,
  description: 'Clerk secret key for soccer-stats API (plain string for App Runner)',
  tags: { Name: `${namePrefix}-clerk-secret-key`, Environment: stack },
});

export const clerkSecretKeySecretVersion = new aws.secretsmanager.SecretVersion(`${namePrefix}-clerk-secret-key-version`, {
  secretId: clerkSecretKeySecret.id,
  secretString: clerkSecretKey,
});

// Grant App Runner instance role access to the Clerk secret
export const clerkSecretPolicy = new aws.iam.RolePolicy(`${namePrefix}-clerk-secret-policy`, {
  role: appRunnerInstanceRoleArn.apply((arn) => arn.split('/').pop()!),
  policy: clerkSecretKeySecret.arn.apply((secretArn) =>
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
});

export const clerkSecretKeySecretArn = clerkSecretKeySecret.arn;
```

- [ ] **Step 2: Commit**

```bash
git add apps/soccer-stats/api-infra/src/secrets.ts
git commit -m "refactor(api-infra): replace JSON Clerk secret with plain-string secret for App Runner"
```

---

## Task 10: Add App Runner Service and Delete ECS/Autoscaling Files

**Files:**

- Create: `apps/soccer-stats/api-infra/src/app-runner.ts`
- Delete: `apps/soccer-stats/api-infra/src/ecs.ts`
- Delete: `apps/soccer-stats/api-infra/src/autoscaling.ts`

- [ ] **Step 1: Create `app-runner.ts`**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { namePrefix, stack, containerPort, frontendUrl, dbPoolMax, dbPoolMin, dbPoolIdleTimeout, dbPoolConnectionTimeout, observabilityLogLevel, slowQueryThresholdMs, queryComplexityLimit, dataLoaderBatchSizeWarning, clerkPublishableKey } from './config';
import { ecrRepositoryUrl, vpcConnectorArn, appRunnerAccessRoleArn, appRunnerInstanceRoleArn, databaseUrlSecretArn } from './shared-infra';
import { clerkSecretKeySecretArn } from './secrets';
import { image } from './docker';

const autoScalingConfig = new aws.apprunner.AutoScalingConfigurationVersion(`${namePrefix}-autoscaling`, {
  autoScalingConfigurationName: namePrefix,
  maxConcurrency: 100,
  minSize: 1,
  maxSize: 10,
  tags: { Name: `${namePrefix}-autoscaling`, Environment: stack },
});

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
            DATALOADER_BATCH_SIZE_WARNING: dataLoaderBatchSizeWarning.toString(),
            CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
            ...(frontendUrl ? { FRONTEND_URL: frontendUrl } : {}),
          },
          runtimeEnvironmentSecrets: pulumi.all([databaseUrlSecretArn, clerkSecretKeySecretArn]).apply(([dbUrlArn, clerkArn]) => ({
            DATABASE_URL: dbUrlArn,
            CLERK_SECRET_KEY: clerkArn,
          })),
        },
      },
    },
    networkConfiguration: {
      egressConfiguration: {
        egressType: 'VPC',
        vpcConnectorArn: vpcConnectorArn,
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
```

- [ ] **Step 2: Delete ECS and autoscaling files**

```bash
rm apps/soccer-stats/api-infra/src/ecs.ts
rm apps/soccer-stats/api-infra/src/autoscaling.ts
```

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/api-infra/src/app-runner.ts
git rm apps/soccer-stats/api-infra/src/ecs.ts apps/soccer-stats/api-infra/src/autoscaling.ts
git commit -m "feat(api-infra): add App Runner service; remove ECS task definition and autoscaling"
```

---

## Task 11: Update api-infra index.ts and Pulumi.dev.yaml

**Files:**

- Modify: `apps/soccer-stats/api-infra/src/index.ts`
- Modify: `apps/soccer-stats/api-infra/Pulumi.dev.yaml`

- [ ] **Step 1: Replace `index.ts`**

```typescript
export { serviceUrl, serviceArn } from './app-runner';
export { ecrRepositoryUrl } from './shared-infra';
import './secrets';
```

- [ ] **Step 2: Replace `Pulumi.dev.yaml`**

```yaml
config:
  aws:region: us-west-2
  soccer-stats-api-infra:pulumiOrganization: JoA-MoS
  # Clerk Authentication (required)
  soccer-stats-api-infra:clerkPublishableKey: pk_test_YWJvdmUtYnVsbGRvZy03LmNsZXJrLmFjY291bnRzLmRldiQ
  # clerkSecretKey is set via: pulumi config set --secret clerkSecretKey <value>
  # CORS Configuration
  soccer-stats-api-infra:frontendUrl: 'https://soccer-stats-ten.vercel.app,https://soccer-stats-joamos-projects.vercel.app,https://d26g1hjb51pz2g.cloudfront.net,http://localhost:4200'
  # Database Connection Pool — dbPoolConnectionTimeout increased to handle Aurora 15-40s cold start
  soccer-stats-api-infra:dbPoolConnectionTimeout: '45000'
  # Observability Configuration
  soccer-stats-api-infra:observabilityLogLevel: 'verbose'
  soccer-stats-api-infra:slowQueryThresholdMs: '1000'
  soccer-stats-api-infra:queryComplexityLimit: '100'
  soccer-stats-api-infra:dataLoaderBatchSizeWarning: '100'
  soccer-stats-api-infra:clerkSecretKey:
    secure: AAABAOQiomuj5CtOyyLE8RLxEG0wSAAqDIByPg/C5C5LhEKN7DHwU96o39uIga/KPDUpop6um2t4mxc8DLVGfGHoyXGhAS9+9WAWJg6X6mn8+Q==
```

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/api-infra/src/index.ts apps/soccer-stats/api-infra/Pulumi.dev.yaml
git commit -m "refactor(api-infra): update exports and config for App Runner"
```

---

## Task 12: Update NestJS — Add DATABASE_URL Support and Run Migrations on Startup

**Files:**

- Modify: `apps/soccer-stats/api/src/app/environment.ts`
- Modify: `apps/soccer-stats/api/src/database/typeorm.config.ts`
- Modify: `apps/soccer-stats/api/src/main.ts`

- [ ] **Step 1: Add `getDatabaseUrl()` to `environment.ts`**

After the `getDbName()` export (around line 88), add:

```typescript
/**
 * PostgreSQL connection URL (set by App Runner via Secrets Manager).
 * When set, TypeORM uses this instead of individual DB_* variables.
 * Local development continues to use DB_HOST, DB_PORT, etc. from .env
 */
export const getDatabaseUrl = (): string | undefined => getEnv('DATABASE_URL');
```

- [ ] **Step 2: Update `typeorm.config.ts` to use `DATABASE_URL` when present and include migrations**

Replace the entire file:

```typescript
import { DataSourceOptions } from 'typeorm';

import { migrations } from '../database/migrations';
import { getDatabaseUrl, getDbHost, getDbPort, getDbUsername, getDbPassword, getDbName, getDbSynchronize, getDbLogging, getDbSsl, getValidatedPoolConfig, getDbPoolIdleTimeout, getDbPoolConnectionTimeout } from '../app/environment';

export const MIGRATIONS_TABLE_NAME = 'typeorm_migrations';

const poolConfig = getValidatedPoolConfig();

const databaseUrl = getDatabaseUrl();

/** Base TypeORM configuration. Uses DATABASE_URL (App Runner) or individual vars (local dev). */
export const baseTypeOrmConfig = {
  type: 'postgres' as const,
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: getDbHost(),
        port: getDbPort(),
        username: getDbUsername(),
        password: getDbPassword(),
        database: getDbName(),
      }),
  synchronize: getDbSynchronize(),
  logging: getDbLogging(),
  ssl: getDbSsl() ? { rejectUnauthorized: false } : false,
  migrationsTableName: MIGRATIONS_TABLE_NAME,
  extra: {
    max: poolConfig.max,
    min: poolConfig.min,
    idleTimeoutMillis: getDbPoolIdleTimeout(),
    connectionTimeoutMillis: getDbPoolConnectionTimeout(),
  },
};

/**
 * TypeORM configuration for NestJS runtime.
 * Includes migrations array so dataSource.runMigrations() works in main.ts.
 */
export const nestTypeOrmConfig: DataSourceOptions = {
  ...baseTypeOrmConfig,
  autoLoadEntities: true,
  migrations,
} as DataSourceOptions;
```

- [ ] **Step 3: Update `main.ts` to run migrations before listening**

Replace the `bootstrap` function body (keep imports and the final `bootstrap().catch()` call):

```typescript
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger({
        json: useJsonLogging(),
      }),
    });

    app.setGlobalPrefix(API_PREFIX);

    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
          return callback(null, true);
        }
        const frontendUrl = getFrontendUrl();
        if (frontendUrl) {
          const allowedOrigins = frontendUrl.split(',').map((url) => url.trim());
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      },
      credentials: true,
    });

    // Run pending TypeORM migrations before accepting traffic.
    // App Runner health check won't pass until this completes, so no traffic
    // is routed until the database schema is up to date.
    const dataSource = app.get(DataSource);
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      logger.log('Running pending database migrations...');
      await dataSource.runMigrations();
      logger.log('Migrations complete.');
    }

    const port = getPort();
    await app.listen(port);

    logger.log(`Soccer Stats API running on port ${port}`);
    logger.log(`GraphQL endpoint: /${API_PREFIX}/graphql`);

    if (!isProduction()) {
      logger.log(`Local URL: http://localhost:${port}/${API_PREFIX}`);
      logger.log(`GraphQL Playground: http://localhost:${port}/${API_PREFIX}/graphql`);
    }
  } catch (error) {
    logger.error('Failed to bootstrap application', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}
```

Also add the `DataSource` import to the top of `main.ts`:

```typescript
import { DataSource } from 'typeorm';
```

- [ ] **Step 4: Run the API tests to verify nothing broke**

```bash
pnpm nx test soccer-stats-api
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/app/environment.ts apps/soccer-stats/api/src/database/typeorm.config.ts apps/soccer-stats/api/src/main.ts
git commit -m "feat(api): run TypeORM migrations on bootstrap; support DATABASE_URL for App Runner"
```

---

## Task 13: Add DB Tunnel Helper Script

**Files:**

- Create: `scripts/db-tunnel.sh`

- [ ] **Step 1: Create `scripts/db-tunnel.sh`**

```bash
mkdir -p scripts
```

```bash
#!/usr/bin/env bash
# db-tunnel.sh — Open an SSM port-forward tunnel to Aurora via the bastion.
#
# Usage: ./scripts/db-tunnel.sh [dev|prod]
# Then connect your DB client to localhost:5432
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Session Manager plugin: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

set -euo pipefail

STACK="${1:-dev}"
NAME_PREFIX="soccer-stats-${STACK}"
LOCAL_PORT=5432

echo "Looking up bastion instance for stack: ${STACK}..."

INSTANCE_ID=$(aws ec2 describe-instances \
  --filters \
    "Name=tag:Name,Values=${NAME_PREFIX}-bastion" \
    "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "ERROR: No running bastion found with tag Name=${NAME_PREFIX}-bastion"
  exit 1
fi

echo "Looking up Aurora endpoint for stack: ${STACK}..."

AURORA_ENDPOINT=$(aws rds describe-db-clusters \
  --filters "Name=db-cluster-id,Values=${NAME_PREFIX}-aurora" \
  --query "DBClusters[0].Endpoint" \
  --output text)

if [ "$AURORA_ENDPOINT" = "None" ] || [ -z "$AURORA_ENDPOINT" ]; then
  echo "ERROR: No Aurora cluster found with id=${NAME_PREFIX}-aurora"
  exit 1
fi

echo "Bastion:  ${INSTANCE_ID}"
echo "Aurora:   ${AURORA_ENDPOINT}:5432"
echo "Tunnel:   localhost:${LOCAL_PORT} -> ${AURORA_ENDPOINT}:5432"
echo ""
echo "Connect your DB client to: localhost:${LOCAL_PORT}"
echo "Credentials: pulumi stack output databaseSecretArn (then aws secretsmanager get-secret-value)"
echo ""
echo "Starting tunnel (Ctrl+C to stop)..."

aws ssm start-session \
  --target "${INSTANCE_ID}" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"${AURORA_ENDPOINT}\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x scripts/db-tunnel.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/db-tunnel.sh
git commit -m "feat: add SSM port-forward helper script for local Aurora access"
```

---

## Task 14: Build and Lint Verification

- [ ] **Step 1: Build all affected projects**

```bash
pnpm nx run-many --target=build --projects=soccer-stats-infra,soccer-stats-api-infra,soccer-stats-api --parallel=3
```

Expected: all three builds succeed.

- [ ] **Step 2: Lint all affected projects**

```bash
pnpm nx run-many --target=lint --projects=soccer-stats-infra,soccer-stats-api-infra,soccer-stats-api --parallel=3
```

Expected: no lint errors.

- [ ] **Step 3: Run API tests**

```bash
pnpm nx test soccer-stats-api
```

Expected: all tests pass.

- [ ] **Step 4: Commit if any auto-fixes were applied**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore: lint fixes from build verification"
```

---

## Task 15: Update ui-infra — Point CloudFront to App Runner

**Files:**

- Modify: `apps/soccer-stats/ui-infra/src/stack-reference.ts`
- Modify: `apps/soccer-stats/ui-infra/src/shared-infra.ts`
- Modify: `apps/soccer-stats/ui-infra/src/cloudfront.ts`
- Modify: `apps/soccer-stats/ui-infra/src/index.ts`

The App Runner service URL lives in api-infra outputs (not shared-infra). CloudFront currently routes `/api/*` to the ALB over HTTP. App Runner is HTTPS-only, so the origin config changes from `http-only` to `https-only`.

- [ ] **Step 1: Add `getApiInfraStackReference()` to `ui-infra/src/stack-reference.ts`**

```typescript
import * as pulumi from '@pulumi/pulumi';

import type { SharedInfraOutputs } from '@garage/soccer-stats/infra';

type SharedInfraKey = keyof SharedInfraOutputs;
type SharedInfraValue<TKey extends SharedInfraKey> = SharedInfraOutputs[TKey];

type StrongTypedStackReference = Omit<pulumi.StackReference, 'getOutput' | 'requireOutput'> & {
  getOutput<T extends SharedInfraKey>(name: pulumi.Input<T>): SharedInfraValue<T>;
  requireOutput<T extends SharedInfraKey>(name: pulumi.Input<T>): SharedInfraValue<T>;
};

export function getSharedInfraStackReference(organization?: string): StrongTypedStackReference {
  const config = new pulumi.Config();
  const org = organization || config.get('pulumiOrganization') || 'JoA-MoS';
  const stack = pulumi.getStack();
  return new pulumi.StackReference(`${org}/soccer-stats-infra/${stack}`) as StrongTypedStackReference;
}

/** Reference to the api-infra stack to get the App Runner service URL. */
export function getApiInfraStackReference(organization?: string): pulumi.StackReference {
  const config = new pulumi.Config();
  const org = organization || config.get('pulumiOrganization') || 'JoA-MoS';
  const stack = pulumi.getStack();
  return new pulumi.StackReference(`${org}/soccer-stats-api-infra/${stack}`);
}
```

- [ ] **Step 2: Replace `ui-infra/src/shared-infra.ts`**

```typescript
import { getApiInfraStackReference } from './stack-reference';

const apiInfra = getApiInfraStackReference();

// App Runner service URL (hostname only, no protocol) — used as CloudFront API origin
export const appRunnerServiceUrl = apiInfra.requireOutput('serviceUrl') as unknown as import('@pulumi/pulumi').Output<string>;
```

- [ ] **Step 3: Update `cloudfront.ts` — replace ALB origin with App Runner origin**

Replace the `origins` array and the `albOrigin` cache behavior reference:

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { namePrefix, stack, customDomain, certificateArn } from './config';
import { appRunnerServiceUrl } from './shared-infra';
import { bucket } from './s3';

export const oac = new aws.cloudfront.OriginAccessControl(`${namePrefix}-oac`, {
  name: `${namePrefix}-oac`,
  description: `OAC for ${namePrefix}`,
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
});

export const distribution = new aws.cloudfront.Distribution(`${namePrefix}-cdn`, {
  enabled: true,
  isIpv6Enabled: true,
  comment: `Soccer Stats UI - ${stack}`,
  defaultRootObject: 'index.html',
  priceClass: stack === 'prod' ? 'PriceClass_All' : 'PriceClass_100',
  aliases: customDomain ? [customDomain] : [],
  origins: [
    {
      domainName: bucket.bucketRegionalDomainName,
      originId: 's3Origin',
      originAccessControlId: oac.id,
    },
    {
      domainName: appRunnerServiceUrl,
      originId: 'appRunnerOrigin',
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: 'https-only', // App Runner is HTTPS-only
        originSslProtocols: ['TLSv1.2'],
        originReadTimeout: 60,
        originKeepaliveTimeout: 5,
      },
    },
  ],
  orderedCacheBehaviors: [
    {
      pathPattern: '/api/*',
      targetOriginId: 'appRunnerOrigin',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
      originRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3', // AllViewer
    },
    {
      pathPattern: '/index.html',
      targetOriginId: 's3Origin',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
      originRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
    },
  ],
  defaultCacheBehavior: {
    targetOriginId: 's3Origin',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,
    cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
    originRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
  },
  customErrorResponses: [
    { errorCode: 403, responseCode: 200, responsePagePath: '/index.html', errorCachingMinTtl: 10 },
    { errorCode: 404, responseCode: 200, responsePagePath: '/index.html', errorCachingMinTtl: 10 },
  ],
  viewerCertificate: customDomain && certificateArn ? { acmCertificateArn: certificateArn, sslSupportMethod: 'sni-only', minimumProtocolVersion: 'TLSv1.2_2021' } : { cloudfrontDefaultCertificate: true },
  restrictions: { geoRestriction: { restrictionType: 'none' } },
  tags: { Name: `${namePrefix}-cdn`, Environment: stack },
});

export const bucketPolicy = new aws.s3.BucketPolicy(`${namePrefix}-bucket-policy`, {
  bucket: bucket.id,
  policy: pulumi.all([bucket.arn, distribution.arn]).apply(([bucketArn, distArn]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowCloudFrontServicePrincipal',
          Effect: 'Allow',
          Principal: { Service: 'cloudfront.amazonaws.com' },
          Action: 's3:GetObject',
          Resource: `${bucketArn}/*`,
          Condition: { StringEquals: { 'AWS:SourceArn': distArn } },
        },
      ],
    }),
  ),
});
```

- [ ] **Step 4: Update `ui-infra/src/index.ts` — remove `albDirectUrl` export**

Replace:

```typescript
export const albDirectUrl = pulumi.interpolate`http://${albDnsName}`;
```

With:

```typescript
export const apiUrl = pulumi.interpolate`https://${appRunnerServiceUrl}`;
```

(Also update the import at the top: replace `import { albDnsName } from './shared-infra'` with `import { appRunnerServiceUrl } from './shared-infra'`.)

- [ ] **Step 5: Build ui-infra to verify**

```bash
pnpm nx build soccer-stats-ui-infra
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/soccer-stats/ui-infra/src/stack-reference.ts apps/soccer-stats/ui-infra/src/shared-infra.ts apps/soccer-stats/ui-infra/src/cloudfront.ts apps/soccer-stats/ui-infra/src/index.ts
git commit -m "refactor(ui-infra): point CloudFront API origin to App Runner service URL"
```

---

## Deployment Notes

Once the code is merged, the deployment order is:

1. **Deploy shared-infra first** (creates VPC, Aurora, VPC Connector, bastion, IAM roles, ECR)
2. **Deploy api-infra** (builds Docker image, creates App Runner service, creates Clerk secret)
3. **Update ui-infra stack reference** if the App Runner service URL is needed as the API origin (CloudFront currently routes to ALB — this routing config may need updating to point to the App Runner service URL)

The `ui-infra` stack references `albDnsName` from shared infra which no longer exists. Before deploying, update `apps/soccer-stats/ui-infra/src/shared-infra.ts` to reference `serviceUrl` from the api-infra stack instead.

**Pulumi destroy order for the old resources (after new stack is stable):**

```bash
# Destroy old api-infra (ECS/ALB) stack first
pulumi destroy --stack dev  # in api-infra
# Then destroy old shared-infra stack
pulumi destroy --stack dev  # in shared-infra (old stack)
```
