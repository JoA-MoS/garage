# Soccer Stats API Infrastructure

Pulumi infrastructure for deploying the Soccer Stats API to AWS ECS Fargate.

## What This Deploys

- **ECS Service** - Fargate Spot tasks running the NestJS API
- **Task Definition** - Container config with secrets injection
- **Auto-scaling** - CPU-based scaling (1-4 tasks)
- **Docker Image** - Built and pushed to ECR

## Prerequisites

- Shared infrastructure deployed (`libs/soccer-stats/infra`)
- Clerk API keys configured
- AWS credentials with appropriate permissions

## Configuration

Set in `Pulumi.<stack>.yaml`:

```yaml
config:
  aws:region: us-west-2
  soccer-stats-api-infra:clerkSecretKey:
    secure: <encrypted>
  soccer-stats-api-infra:clerkPublishableKey: pk_test_...
  soccer-stats-api-infra:frontendUrl: https://your-domain.com # optional
```

## Deploy

```bash
# Deploy to dev (builds automatically)
pnpm nx up soccer-stats-api-infra

# Preview changes
pnpm nx preview soccer-stats-api-infra
```

## Outputs

- `serviceUrl` - ALB URL for direct API access (internal/debugging)
- `ecrImageUri` - Docker image URI in ECR

## Related

- [AWS Architecture](../docs/aws-architecture.md) - Full architecture overview
- [Shared Infrastructure](../../../libs/soccer-stats/infra/README.md) - VPC, ECS cluster, ALB
