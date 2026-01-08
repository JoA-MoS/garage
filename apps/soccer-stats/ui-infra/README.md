# Soccer Stats UI Infrastructure

Pulumi infrastructure for deploying the Soccer Stats UI to AWS S3 + CloudFront.

## What This Deploys

- **S3 Bucket** - Static asset storage (private, accessed via CloudFront OAC)
- **CloudFront Distribution** - CDN with HTTPS, caching, and API routing
- **Origin Access Control** - Secure S3 access without public bucket

## Architecture

```
User → CloudFront (HTTPS)
         ├─ /api/* → ALB (API backend)
         └─ /* → S3 (static assets)
```

CloudFront handles:

- HTTPS termination
- Static asset caching
- SPA routing (404 → index.html)
- API proxying to ALB (same-origin, no CORS needed)

## Prerequisites

- Shared infrastructure deployed (`libs/soccer-stats/infra`)
- UI built (`pnpm nx build soccer-stats-ui`)
- AWS credentials with appropriate permissions

## Configuration

Set in `Pulumi.<stack>.yaml`:

```yaml
config:
  aws:region: us-west-2
  soccer-stats-ui-infra:customDomain: stats.example.com # optional
  soccer-stats-ui-infra:certificateArn: arn:aws:acm:... # required if using customDomain
```

## Deploy

```bash
# Build UI first
pnpm nx build soccer-stats-ui

# Deploy to dev (builds infra automatically)
pnpm nx up soccer-stats-ui-infra

# Preview changes
pnpm nx preview soccer-stats-ui-infra
```

## Outputs

- `cloudfrontUrl` - CloudFront distribution URL (https://xxx.cloudfront.net)
- `bucketName` - S3 bucket name for static assets

## Related

- [AWS Architecture](../docs/aws-architecture.md) - Full architecture overview
- [Shared Infrastructure](../../../libs/soccer-stats/infra/README.md) - VPC, ECS cluster, ALB
