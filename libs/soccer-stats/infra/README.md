# Soccer Stats Shared Infrastructure

Pulumi library providing shared AWS infrastructure for the Soccer Stats application.

## What This Creates

- **VPC** - 10.0.0.0/16 with public and private subnets across 2 AZs
- **ECS Cluster** - Fargate Spot capacity provider for cost optimization
- **Application Load Balancer** - Routes traffic to ECS services
- **Aurora Serverless v2** - PostgreSQL database with auto-scaling (0.5-4 ACUs)
- **ECR Repository** - Docker image registry with lifecycle policy
- **Security Groups** - Network isolation (ALB → ECS → RDS)
- **IAM Roles** - Task execution and task roles with least-privilege
- **CloudWatch Logs** - Centralized logging for ECS tasks
- **Secrets Manager** - Database credentials storage

## Architecture

See [AWS Architecture](../../../apps/soccer-stats/docs/aws-architecture.md) for the full diagram.

## Usage

This is a library consumed by app-specific infrastructure stacks:

```typescript
import { getSharedInfraStackReference } from './stack-reference';

const sharedInfra = getSharedInfraStackReference();
const clusterArn = sharedInfra.requireOutput('clusterArn');
const vpcId = sharedInfra.requireOutput('vpcId');
```

## Deploy

```bash
# Deploy shared infrastructure first (builds automatically)
pnpm nx up soccer-stats-infra

# Then deploy app-specific stacks
pnpm nx up soccer-stats-api-infra
pnpm nx up soccer-stats-ui-infra

# Preview changes
pnpm nx preview soccer-stats-infra
```

## Outputs

| Output                 | Description                            |
| ---------------------- | -------------------------------------- |
| `vpcId`                | VPC ID                                 |
| `publicSubnetIds`      | Public subnet IDs (ALB)                |
| `privateSubnetIds`     | Private subnet IDs (ECS, RDS)          |
| `clusterArn`           | ECS cluster ARN                        |
| `albDnsName`           | Application Load Balancer DNS          |
| `apiTargetGroupArn`    | Target group for API service           |
| `ecrRepositoryUrl`     | ECR repository URL                     |
| `dbEndpoint`           | Aurora database endpoint               |
| `dbSecretArn`          | Secrets Manager ARN for DB credentials |
| `taskExecutionRoleArn` | ECS task execution role                |
| `taskRoleArn`          | ECS task role                          |
| `logGroupName`         | CloudWatch log group                   |
| `region`               | AWS region                             |

## Configuration

Set in `Pulumi.<stack>.yaml`:

```yaml
config:
  aws:region: us-west-2
  soccer-stats-infra:vpcCidr: 10.0.0.0/16 # optional
  soccer-stats-infra:dbMinCapacity: 0.5 # Aurora ACUs
  soccer-stats-infra:dbMaxCapacity: 4 # Aurora ACUs
```
