import * as pulumi from '@pulumi/pulumi';

import { stack, customDomain } from './config';
import { apiServiceUrl } from './shared-infra';
import { bucket } from './s3';
import { distribution } from './cloudfront';

// Import sync to ensure files are synced (side effect)
import './sync';

// =============================================================================
// Exports
// =============================================================================
export const bucketName = bucket.bucket;
export const bucketArn = bucket.arn;
export const distributionId = distribution.id;
export const distributionArn = distribution.arn;
export const distributionDomainName = distribution.domainName;

// The website URL - both UI and API are accessible from this origin
export const websiteUrl = customDomain
  ? pulumi.interpolate`https://${customDomain}`
  : pulumi.interpolate`https://${distribution.domainName}`;

// API is now accessible via CloudFront at /api/* (same origin as UI)
// This eliminates CORS issues since everything is under the same domain
export const apiEndpoint = customDomain
  ? pulumi.interpolate`https://${customDomain}/api`
  : pulumi.interpolate`https://${distribution.domainName}/api`;

// ALB hostname (for reference only) — HTTP only, no ACM cert on the ALB, and
// not reachable directly: its security group only allows inbound traffic
// from CloudFront's IP ranges. Use websiteUrl/apiEndpoint for actual requests.
export const apiUrl = pulumi.interpolate`http://${apiServiceUrl}`;

export const environment = stack;
