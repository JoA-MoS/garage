# Design: Migrate Soccer Stats to App Runner + Aurora Serverless v2

**Date:** 2026-04-18
**Goal:** Reduce hosting cost from ~$52/month to ~$8–13/month by replacing ECS + ALB with AWS App Runner and switching to Aurora Serverless v2 (scale to zero).

---

## ⚠️ App Runner Sunset Notice (added 2026-07-11)

AWS stopped accepting **new** App Runner customers on **April 30, 2026**
([availability change](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html)).
This deployment is unaffected: existing customers can keep using the service
and creating new resources (verified — our service was created 2026-07-10),
AWS continues security/availability maintenance, and **no end-of-support date
has been announced**. No new features will ship.

Implications:

- **Keep running on App Runner** until AWS announces an actual end-of-support
  date — it remains the cheapest option for this app.
- AWS's recommended successor, **ECS Express Mode**, provisions an ALB and
  always-on Fargate, which reinstates most of the cost this migration removed.
  When migration becomes necessary, re-evaluate against Lambda + Web Adapter
  (scales to zero) or a minimal hand-rolled Fargate setup.
- App Runner-specific code is deliberately isolated for a bounded future swap:
  `apps/soccer-stats/api-infra/src/app-runner.ts`, the VPC Connector module,
  the two App Runner IAM roles, and CloudFront's API origin config. Aurora,
  VPC, bastion/NAT, and secrets all carry over unchanged.
- **New AWS accounts cannot create App Runner services** — if this stack is
  ever stood up in a fresh account (e.g., a prod account split), the successor
  decision must be made then.

---

## Problem

The current AWS stack has three always-on cost anchors that cannot scale to zero:

| Resource                      | Monthly Cost |
| ----------------------------- | ------------ |
| Application Load Balancer     | ~$15         |
| Standard RDS PostgreSQL       | ~$14         |
| VPC endpoints / data transfer | ~$13         |

For a beta-phase youth soccer tracker with low and bursty traffic, this is unnecessarily expensive.

---

## Solution

Replace ECS Fargate + ALB with **AWS App Runner**, and replace Standard RDS with **Aurora Serverless v2 (min 0 ACU)**. App Runner is a managed container service that includes routing, TLS termination, and auto-scaling without a load balancer. Aurora Serverless v2 at 0 ACU minimum pauses compute when idle and resumes in ~15–40 seconds.

Cold starts are acceptable: coaches/parents may see a brief delay opening the app after inactivity.

### Target Architecture

```
CloudFront → App Runner Service (NestJS)
                     ↓ VPC Connector
              Aurora Serverless v2 (0–4 ACU)
```

App Runner connects to Aurora via a **VPC Connector** — a bridge from App Runner's managed network into the VPC where Aurora resides. WebSocket connections (GraphQL subscriptions) are supported natively by App Runner via HTTP Upgrade.

---

## Infrastructure Changes

### Shared Infrastructure Library (`libs/soccer-stats/infra`)

#### Modules Removed

- `modules/ecs.ts` — ECS cluster no longer needed
- `modules/load-balancer.ts` — ALB replaced by App Runner's built-in endpoint

#### Modules Modified

**`modules/security-groups.ts`**

- Remove: ALB security group, ECS security group
- Add: App Runner VPC Connector security group (outbound to Aurora on port 5432)
- Modify: RDS security group ingress changes from "allow from ECS SG" → "allow from App Runner connector SG"

**`modules/iam.ts`**

- Remove: ECS task execution role, ECS task role
- Add two new roles:
  - **Access role** — principal `build.apprunner.amazonaws.com`, grants ECR image pull permissions
  - **Instance role** — principal `tasks.apprunner.amazonaws.com`, grants Secrets Manager read + CloudWatch Logs write

#### Modules Added

**`modules/vpc-connector.ts`**

- Creates `aws.apprunner.VpcConnector` pointing at private subnets
- Attaches the App Runner connector security group

#### Types Updated (`types.ts`)

**`SharedInfraOutputs` — removed fields:**

- `albSecurityGroupId`, `ecsSecurityGroupId`
- `clusterArn`, `clusterName`
- `albArn`, `albDnsName`, `albZoneId`, `apiTargetGroupArn`, `httpListenerArn`
- `taskExecutionRoleArn`, `taskRoleArn`

**`SharedInfraOutputs` — added fields:**

- `vpcConnectorArn`
- `appRunnerInstanceRoleArn`
- `appRunnerAccessRoleArn`

**`SharedInfraConfig` — changed defaults:**

- `useAuroraServerless`: default changes from `stack === 'prod'` → always `true`
- `databaseMinCapacity`: default changes from `0.5` → `0`

#### `shared-infrastructure.ts`

- Remove calls to `createEcsCluster()`, `createLoadBalancer()`
- Add call to `createVpcConnector()`
- Update `createIamRoles()` call signature for new App Runner roles
- Update `createSecurityGroups()` call signature
- Update `createDatabase()` to default to Aurora with min 0 ACU
- Update returned outputs to match new `SharedInfraOutputs` shape

---

### api-infra (`apps/soccer-stats/api-infra`)

#### Files Removed

- `src/ecs.ts`
- `src/autoscaling.ts`

#### Files Added

**`src/app-runner.ts`**

- Creates `aws.apprunner.Service`
- Image source: ECR (pulls from the existing ECR repository)
- Port: 3333
- CPU: 0.25 vCPU, Memory: 0.5 GB (App Runner minimum)
- Health check: GET `/api/health`, start period 120s (allows Aurora cold start + migrations)
- Environment variables and secrets: identical to current ECS task definition
- VPC connector: attaches via `vpcConnectorArn` from shared stack
- Auto-scaling: min 1, max 10, max concurrency 100
- Auto-deploy: enabled on ECR image push

#### Files Modified

**`src/shared-infra.ts`**

- Remove: `clusterArn`, `ecsSecurityGroupId`, `apiTargetGroupArn`, `taskExecutionRoleArn`, `taskRoleArn`
- Add: `vpcConnectorArn`, `appRunnerInstanceRoleArn`, `appRunnerAccessRoleArn`

**`src/config.ts`**

- Remove: `cpu`, `memory`, `desiredCount`, `minCapacity`, `maxCapacity`, `cpuTargetUtilization`
- Keep: `containerPort`, Clerk keys, CORS config, DB pool config, observability config

**`src/index.ts`**

- Export App Runner service URL and ARN instead of ECS service/task definition ARNs

**`Pulumi.dev.yaml`**

- Remove ECS-specific config entries
- Change `dbPoolConnectionTimeout` from `5000` → `45000` (critical: handles Aurora 15–40s cold start)

---

### NestJS API (`apps/soccer-stats/api`)

**`src/main.ts`** — run TypeORM migrations during bootstrap before `app.listen()`:

```typescript
// Run pending migrations before accepting traffic
// App Runner health check won't pass until this completes
const dataSource = app.get(DataSource);
await dataSource.runMigrations();

await app.listen(port);
```

This replaces the ECS sidecar container pattern. App Runner's 120-second health check start period gives sufficient time for Aurora to wake (15–40s) and migrations to run.

The existing `StartupService` baseline migration registration continues to work alongside this.

---

## Database

Aurora Serverless v2 is already implemented in the codebase (`modules/database.ts`). Required config changes:

| Setting               | Old                          | New                     |
| --------------------- | ---------------------------- | ----------------------- |
| `useAuroraServerless` | `false` (dev), `true` (prod) | `true` always           |
| `databaseMinCapacity` | `0.5` ACU                    | `0` ACU (scale to zero) |
| `databaseMaxCapacity` | `4` ACU                      | `4` ACU (unchanged)     |

Aurora at 0 ACU pauses after ~5 minutes of no connections. First connection after pause triggers scale-up (~15–40s). The increased `dbPoolConnectionTimeout` (45s) in TypeORM handles this wait.

---

## Cost Estimate

| Component                           | Current        | New                                         |
| ----------------------------------- | -------------- | ------------------------------------------- |
| Application Load Balancer           | ~$15/month     | $0                                          |
| Standard RDS PostgreSQL             | ~$14/month     | ~$1–3/month (Aurora storage only when idle) |
| VPC endpoints / transfer            | ~$13/month     | ~$1–2/month (transfer only)                 |
| ECS Fargate Spot                    | ~$3/month      | $0                                          |
| App Runner (1 min instance, 0.5 GB) | $0             | ~$3–5/month                                 |
| Secrets Manager                     | ~$0.75/month   | ~$0.40/month                                |
| ECR + CloudWatch                    | ~$2/month      | ~$1–2/month                                 |
| **Total**                           | **~$52/month** | **~$8–13/month**                            |

---

## Local Database Access

Aurora Serverless v2 cannot be made publicly accessible (AWS limitation). To maintain local DB connectivity, a **SSM-enabled bastion EC2 instance** is added to the shared infrastructure.

### Bastion Design

- Instance type: `t4g.nano` (ARM, ~$3/month)
- Placement: public subnet, no key pairs required
- IAM: SSM instance profile only (`AmazonSSMManagedInstanceCore` policy)
- Security group: allows outbound to Aurora on port 5432 only
- Aurora security group ingress: add rule allowing from bastion security group

### Usage

```bash
aws ssm start-session \
  --target <bastion-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<aurora-endpoint>"],"portNumber":["5432"],"localPortNumber":["5432"]}'
```

Then connect any DB client (Adminer, psql, TablePlus) to `localhost:5432` with the credentials from Secrets Manager.

A helper script (`scripts/db-tunnel.sh`) will be added to the repo to wrap this command with the correct instance ID and Aurora endpoint auto-populated from Pulumi stack outputs.

### Pulumi Changes

In `modules/bastion.ts` (new):

- `aws.ec2.Instance` (t4g.nano, Amazon Linux 2023)
- SSM instance profile + `AmazonSSMManagedInstanceCore` policy attachment
- Bastion security group (egress to Aurora port 5432 only)

In `shared-infrastructure.ts`:

- Add `createBastion()` call
- Add bastion instance ID to `SharedInfraOutputs`

In `modules/security-groups.ts`:

- Add bastion security group ingress rule to RDS security group

### Cost Addition

| Component        | Cost      |
| ---------------- | --------- |
| t4g.nano bastion | ~$3/month |

Revised total: **~$11–16/month** (still down from $52/month).

---

## What Does Not Change

- Frontend: S3 + CloudFront (unchanged)
- ECR repository (App Runner pulls from it)
- VPC, subnets (Aurora still lives in the VPC)
- Clerk authentication
- GraphQL schema and all application code
- CI/CD pipeline (continues pushing to ECR; App Runner auto-deploys on push)
- Pulumi stack structure (shared-infra → api-infra → ui-infra)

---

## Risks and Mitigations

| Risk                                                      | Mitigation                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Aurora cold start causes first-request timeout            | Increase `dbPoolConnectionTimeout` to 45s; TypeORM will wait for connection     |
| Migrations fail on startup and block traffic              | App Runner health check fails → no traffic routed; old revision stays live      |
| WebSocket (GraphQL subscriptions) drops                   | App Runner supports WS natively; NestJS WS keepalive pings prevent idle timeout |
| App Runner min=1 means never truly zero compute           | Memory billing ~$2.52/month; acceptable vs. $15 ALB                             |
| Aurora not publicly accessible (Serverless v2 limitation) | SSM bastion provides secure tunnel for local dev access                         |
