import * as pulumi from '@pulumi/pulumi';

import { getApiInfraStackReference } from './stack-reference';

// =============================================================================
// Import API Infrastructure
// =============================================================================
const apiInfra = getApiInfraStackReference();

// App Runner service URL (hostname only, no protocol) — used as CloudFront API origin
// API is accessible via CloudFront at /api/* (same origin as UI)
// This eliminates CORS issues and simplifies frontend configuration
export const appRunnerServiceUrl = apiInfra.requireOutput(
  'serviceUrl',
) as pulumi.Output<string>;
