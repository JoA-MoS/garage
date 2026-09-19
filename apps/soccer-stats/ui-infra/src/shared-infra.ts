import * as pulumi from '@pulumi/pulumi';

import {
  getApiInfraStackReference,
  getSharedInfraStackReference,
} from './stack-reference';

// =============================================================================
// Import API Infrastructure
// =============================================================================
const apiInfra = getApiInfraStackReference();
const sharedInfra = getSharedInfraStackReference();

// API ALB hostname (no protocol) — used as CloudFront API origin
// API is accessible via CloudFront at /api/* (same origin as UI)
// This eliminates CORS issues and simplifies frontend configuration
export const apiServiceUrl = apiInfra.requireOutput(
  'serviceUrl',
) as pulumi.Output<string>;

// Shared secret attached as a CloudFront custom origin header, checked by
// the ALB listener rule (see apps/soccer-stats/api-infra/src/ecs-fargate.ts)
// so the API can't be reached by pointing another CloudFront distribution
// at the same ALB.
export const originVerifySecret = sharedInfra.requireOutput(
  'originVerifySecret',
) as pulumi.Output<string>;
