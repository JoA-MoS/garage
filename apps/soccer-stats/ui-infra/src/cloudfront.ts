import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { namePrefix, stack, customDomain, certificateArn } from './config';
import { albDnsName } from './shared-infra';
import { bucket } from './s3';

// =============================================================================
// CloudFront Origin Access Control
// =============================================================================
export const oac = new aws.cloudfront.OriginAccessControl(`${namePrefix}-oac`, {
  name: `${namePrefix}-oac`,
  description: `OAC for ${namePrefix}`,
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
});

// =============================================================================
// CloudFront Distribution
// =============================================================================
export const distribution = new aws.cloudfront.Distribution(
  `${namePrefix}-cdn`,
  {
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
    // Ordered cache behaviors (evaluated before default)
    orderedCacheBehaviors: [
      // API routing - forwards to ALB origin
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
      // SPA entry point - minimal caching to ensure users get latest version after deployments
      // Note: defaultRootObject rewrites "/" to "/index.html" before cache behavior matching
      {
        pathPattern: '/index.html',
        targetOriginId: 's3Origin',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        // Disable caching - index.html should always be fresh
        cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
        originRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
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
  },
);

// =============================================================================
// S3 Bucket Policy (Allow CloudFront Access)
// =============================================================================
export const bucketPolicy = new aws.s3.BucketPolicy(
  `${namePrefix}-bucket-policy`,
  {
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
  },
);
