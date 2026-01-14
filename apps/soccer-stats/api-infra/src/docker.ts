import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as docker from '@pulumi/docker-build';
import { workspaceRoot } from '@nx/devkit';

import { namePrefix, stack } from './config';
import { ecrRepositoryUrl } from './shared-infra';

// =============================================================================
// Build and Push Docker Image
// =============================================================================
// Get current AWS region for ECR auth
export const currentRegion = aws.getRegionOutput();

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

export const image = new docker.Image(`${namePrefix}-image`, {
  // Build context is the monorepo root (using Nx workspaceRoot for robustness)
  context: {
    location: workspaceRoot,
  },
  dockerfile: {
    location: `${workspaceRoot}/apps/soccer-stats/api/Dockerfile`,
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
