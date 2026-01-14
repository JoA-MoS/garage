import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { namePrefix, stack } from './config';

// =============================================================================
// S3 Bucket for Static Assets
// =============================================================================
// Note: Website configuration is not needed since CloudFront uses OAC to access
// the bucket directly via S3 API (not the website endpoint). SPA routing is
// handled by CloudFront's custom error responses.
export const bucket = new aws.s3.Bucket(`${namePrefix}-bucket`, {
  bucket: `${namePrefix}-${pulumi.getProject()}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-'),
  tags: {
    Name: `${namePrefix}-bucket`,
    Environment: stack,
  },
});

// Block public access (CloudFront will access via OAC)
export const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `${namePrefix}-public-access-block`,
  {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
);
