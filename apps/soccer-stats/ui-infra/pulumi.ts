import path from 'path';

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as synced from '@pulumi/synced-folder';
import { workspaceRoot } from '@nx/devkit';

import { getSharedInfraStackReference } from './stack-reference';

// =============================================================================
// Configuration
// =============================================================================
const config = new pulumi.Config();
const stack = pulumi.getStack();

// Optional: Custom domain configuration
const customDomain = config.get('customDomain');
const certificateArn = config.get('certificateArn'); // ACM certificate ARN

// Path to built UI assets (relative to workspace root, resolved at runtime)
// The UI build outputs to: {workspaceRoot}/dist/apps/soccer-stats/ui
const buildPath =
  config.get('buildPath') ||
  path.join(workspaceRoot, 'dist/apps/soccer-stats/ui');

// Naming convention
const namePrefix = `soccer-stats-ui-${stack}`;

// =============================================================================
// Import Shared Infrastructure
// =============================================================================
const sharedInfra = getSharedInfraStackReference();

// Get ALB details for API routing
const albDnsName = sharedInfra.requireOutput('albDnsName');

// API will be accessible via CloudFront at /api/* (same origin as UI)
// This eliminates CORS issues and simplifies frontend configuration

// =============================================================================
// S3 Bucket for Static Assets
// =============================================================================
// Note: Website configuration is not needed since CloudFront uses OAC to access
// the bucket directly via S3 API (not the website endpoint). SPA routing is
// handled by CloudFront's custom error responses.
const bucket = new aws.s3.Bucket(`${namePrefix}-bucket`, {
  bucket: `${namePrefix}-${pulumi.getProject()}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-'),
  tags: {
    Name: `${namePrefix}-bucket`,
    Environment: stack,
  },
});

// Block public access (CloudFront will access via OAC)
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `${namePrefix}-public-access-block`,
  {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
);

// =============================================================================
// CloudFront Origin Access Control
// =============================================================================
const oac = new aws.cloudfront.OriginAccessControl(`${namePrefix}-oac`, {
  name: `${namePrefix}-oac`,
  description: `OAC for ${namePrefix}`,
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
});

// =============================================================================
// CloudFront Distribution
// =============================================================================
const distribution = new aws.cloudfront.Distribution(`${namePrefix}-cdn`, {
  enabled: true,
  isIpv6Enabled: true,
  comment: `Soccer Stats UI - ${stack}`,
  defaultRootObject: 'index.html',
  priceClass: stack === 'prod' ? 'PriceClass_All' : 'PriceClass_100', // Cheaper in dev
  // Custom domain (optional)
  aliases: customDomain ? [customDomain] : [],
  // Origin configuration (S3 for UI, ALB for API)
  origins: [
    {
      domainName: bucket.bucketRegionalDomainName,
      originId: 's3Origin',
      originAccessControlId: oac.id,
    },
    {
      domainName: albDnsName,
      originId: 'albOrigin',
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: 'http-only', // ALB is HTTP, CloudFront handles HTTPS
        originSslProtocols: ['TLSv1.2'],
        originReadTimeout: 60,
        originKeepaliveTimeout: 5,
      },
    },
  ],
  // API cache behavior (must come before default)
  // Routes /api/* to ALB origin
  orderedCacheBehaviors: [
    {
      pathPattern: '/api/*',
      targetOriginId: 'albOrigin',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: [
        'GET',
        'HEAD',
        'OPTIONS',
        'PUT',
        'POST',
        'PATCH',
        'DELETE',
      ],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      // Disable caching for API responses (dynamic content)
      cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
      // Forward all headers, cookies, and query strings to origin
      originRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3', // AllViewer
    },
  ],
  // Default cache behavior (S3 for UI assets)
  defaultCacheBehavior: {
    targetOriginId: 's3Origin',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,
    // Use managed cache policy for S3 origins
    cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
    originRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
  },
  // Custom error responses for SPA routing
  customErrorResponses: [
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: '/index.html',
      errorCachingMinTtl: 10,
    },
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: '/index.html',
      errorCachingMinTtl: 10,
    },
  ],
  // SSL configuration
  viewerCertificate:
    customDomain && certificateArn
      ? {
          acmCertificateArn: certificateArn,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        }
      : {
          cloudfrontDefaultCertificate: true,
        },
  // Geo restrictions (none for now)
  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },
  tags: {
    Name: `${namePrefix}-cdn`,
    Environment: stack,
  },
});

// =============================================================================
// S3 Bucket Policy (Allow CloudFront Access)
// =============================================================================
const bucketPolicy = new aws.s3.BucketPolicy(`${namePrefix}-bucket-policy`, {
  bucket: bucket.id,
  policy: pulumi
    .all([bucket.arn, distribution.arn])
    .apply(([bucketArn, distArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': distArn,
              },
            },
          },
        ],
      }),
    ),
});

// =============================================================================
// Sync Built Files to S3
// =============================================================================
// Note: This syncs files from the built UI to S3
// The build path is relative to the Pulumi project directory
const syncedFolder = new synced.S3BucketFolder(`${namePrefix}-sync`, {
  path: buildPath,
  bucketName: bucket.bucket,
  acl: 'private',
  // Manage content types
  managedObjects: true,
});

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

// Direct ALB URL (for debugging/internal use only)
export const albDirectUrl = pulumi.interpolate`http://${albDnsName}`;

export const environment = stack;
