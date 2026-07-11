# Soccer Stats — Continuous Deployment

How soccer-stats deploys to AWS from GitHub Actions, and everything that was
set up on each provider to make it work. Added 2026-07-11 alongside the
App Runner + Aurora migration (PR #268).

## How a deploy happens

```
push to main
     │
     ▼
.github/workflows/deploy-soccer-stats.yml
     │  nx affected --target=up --parallel=1
     ▼
┌─────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐
│ soccer-stats-infra  │──▶│ soccer-stats-api-    │──▶│ soccer-stats-ui-    │
│ (VPC, Aurora, ECR,  │   │ infra (Docker build  │   │ infra (UI build, S3 │
│ bastion/NAT, IAM)   │   │ + push, App Runner)  │   │ sync, CloudFront)   │
└─────────────────────┘   └──────────────────────┘   └─────────────────────┘
     │
     ▼
health check: https://d26g1hjb51pz2g.cloudfront.net/api/health
```

Only **affected** stacks run — Nx computes what changed since the last
successful run (`nrwl/nx-set-shas`), and the `dependsOn` graph in each
project's `project.json` enforces the ordering above and pulls in TypeScript
builds, the UI build, and the Docker image push automatically.

### The three deployment tiers

| Change                                                 | What actually deploys it                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API code only                                          | CI builds and pushes a new `:dev` image to ECR. **App Runner auto-deploys it by itself** (`autoDeploymentsEnabled: true` watches the tag) — the `pulumi up` is a near-no-op. Health check gates traffic; migrations run at bootstrap under a `pg_advisory_lock` before the instance reports healthy. |
| UI code only                                           | `soccer-stats-ui-infra:up` rebuilds the UI, syncs `dist` to S3, and CloudFront picks it up (index.html is never cached).                                                                                                                                                                             |
| Infra code (`libs/soccer-stats/infra`, `*-infra` apps) | Full `pulumi up` for the affected stacks, in dependency order.                                                                                                                                                                                                                                       |

### Safety rails

- **Concurrency group** (`deploy-soccer-stats`): two pushes to main queue up
  instead of running `pulumi up` against the same stacks simultaneously.
- **Post-deploy health check**: polls `/api/health` for up to 5 minutes
  (retries cover Aurora's 15–40 s resume from 0 ACU) and fails the run if the
  API never comes healthy.
- **Manual escape hatch**: the workflow has `workflow_dispatch`, which skips
  the affected calculation and deploys **all three stacks**. Trigger from the
  Actions tab or `gh workflow run deploy-soccer-stats.yml`.
- Third-party actions are **pinned to commit SHAs** because this workflow can
  mint AWS credentials — a hijacked action tag must not be able to steal them.

### Deploying from a laptop instead

The same targets CI uses are available locally (Pulumi + AWS credentials
required):

```bash
pnpm deploy:infra   # shared stack
pnpm deploy:api     # API stack (builds + pushes the image)
pnpm deploy:ui      # UI stack
pnpm deploy:all     # everything, in order
```

Always run these from the **workspace root** — running `nx build` from inside
a lib directory corrupts the generated `dist/**/package.json` paths.

## Provider setup (what had to be configured, and where)

### AWS — OIDC trust, no stored keys

GitHub Actions authenticates by exchanging its OIDC token for temporary AWS
credentials. Nothing long-lived is stored in GitHub. All of this is managed by
Pulumi in `libs/soccer-stats/infra/src/lib/modules/github-oidc.ts`:

| Resource                                                | Purpose                                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IAM OIDC provider `token.actions.githubusercontent.com` | Lets AWS validate GitHub's workflow tokens                                                                                                                                          |
| IAM role `soccer-stats-dev-cd-role-*`                   | Assumed by the workflow via `aws-actions/configure-aws-credentials`                                                                                                                 |
| Trust policy                                            | Only tokens with `sub = repo:JoA-MoS/garage:ref:refs/heads/main` and `aud = sts.amazonaws.com` can assume the role — no other repo, branch, or PR can                               |
| Permissions                                             | `PowerUserAccess` + an inline policy for the IAM actions Pulumi needs (create/delete roles, instance profiles, PassRole). Account-wide scope; acceptable for a single-owner account |

The role ARN is a stack output: `pulumi stack output cdRoleArn` in
`libs/soccer-stats/infra`.

### GitHub — one secret, one variable

Set on the `JoA-MoS/garage` repo (Settings → Secrets and variables → Actions):

| Name                  | Kind     | Value                     | Notes                                                                                                                                            |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PULUMI_ACCESS_TOKEN` | Secret   | Pulumi Cloud access token | Currently the owner's personal token — **mint a dedicated CI token** in the Pulumi console (Settings → Access Tokens) and rotate when convenient |
| `AWS_CD_ROLE_ARN`     | Variable | `cdRoleArn` stack output  | Re-set it if the role is ever recreated: `gh variable set AWS_CD_ROLE_ARN --body "$(pulumi stack output cdRoleArn)"`                             |

The workflow itself needs `permissions: id-token: write` (already declared)
for OIDC token issuance.

### Pulumi Cloud — state and stack config

- State backend: Pulumi Cloud, org **`JoA-MoS`** (the old `JoA-MoS-org`
  stacks were removed). Three stacks, all named `dev`:
  `soccer-stats-infra`, `soccer-stats-api-infra`, `soccer-stats-ui-infra`.
- **`Pulumi.dev.yaml` files are committed** (gitignore exceptions) because CI
  needs the stack config to run `pulumi up`. The `clerkSecretKey` inside is
  ciphertext encrypted with the stack's Pulumi-managed key — safe in git.
  Change it with `pulumi config set --secret clerkSecretKey <value>` in
  `apps/soccer-stats/api-infra`, then commit the updated file.
- ⚠️ `pulumi stack rm <org>/<name>` deletes the local `Pulumi.<name>.yaml`
  for that stack name — even when removing another org's stack. Recover with
  `pulumi config refresh` (restores config from the last deployment).

## Troubleshooting

| Symptom                                            | Likely cause / fix                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AssumeRoleWithWebIdentity` denied                 | Workflow ran from a ref other than `main`, or the role was recreated and `AWS_CD_ROLE_ARN` is stale                                                                                                                                                                          |
| App Runner stuck in `CREATE_FAILED`                | The service can't be updated in that state. Check the app logs in CloudWatch (`/aws/apprunner/soccer-stats-api-dev/*/application`), then delete the service (`aws apprunner delete-service`), `pulumi state delete` its URN in `apps/soccer-stats/api-infra`, fix, re-deploy |
| Health check step fails but the deploy succeeded   | Aurora may have taken longer than 5 min to resume, or the app is crash-looping — check App Runner application logs                                                                                                                                                           |
| `/api/*` via CloudFront returns the SPA index.html | App Runner returned 404/403 and the SPA error-page rule rewrote it. Usually the `Host` header (must use the `AllViewerExceptHostHeader` origin request policy) or a broken service                                                                                           |
| CI Docker build is slow                            | Expected on cold runners; `cacheFrom` pulls layer cache from the `:dev` ECR tag                                                                                                                                                                                              |

## Adding a prod environment (future)

1. `pulumi stack init prod` in each of the three projects; add
   `Pulumi.prod.yaml` configs (Aurora `dbMinCapacity` probably ≥ 0.5, App
   Runner `minSize` per traffic).
2. Extend the CD role's trust policy `allowedRefs` (or add a second role) and
   use a GitHub **Environment** with required reviewers for the prod job.
3. Note: App Runner is closed to new AWS _accounts_ (see the sunset notice in
   `docs/superpowers/specs/2026-04-18-app-runner-aurora-migration-design.md`) —
   a prod stack in **this** account is fine; a new account would force the
   successor decision (ECS Express Mode vs Lambda + Web Adapter).
