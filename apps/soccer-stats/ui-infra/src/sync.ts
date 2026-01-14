import * as synced from '@pulumi/synced-folder';

import { namePrefix, buildPath } from './config';
import { bucket } from './s3';

// =============================================================================
// Sync Built Files to S3
// =============================================================================
// Note: This syncs files from the built UI to S3
// The build path is relative to the Pulumi project directory
export const syncedFolder = new synced.S3BucketFolder(`${namePrefix}-sync`, {
  path: buildPath,
  bucketName: bucket.bucket,
  acl: 'private',
  // Manage content types
  managedObjects: true,
});
