import path from 'path';

import * as pulumi from '@pulumi/pulumi';
import { workspaceRoot } from '@nx/devkit';

const config = new pulumi.Config();

export const stack = pulumi.getStack();

// Optional: Custom domain configuration
export const customDomain = config.get('customDomain');
export const certificateArn = config.get('certificateArn'); // ACM certificate ARN

// Path to built UI assets (relative to workspace root, resolved at runtime)
// The UI build outputs to: {workspaceRoot}/dist/apps/soccer-stats/ui
export const buildPath =
  config.get('buildPath') ||
  path.join(workspaceRoot, 'dist/apps/soccer-stats/ui');

// Naming convention
export const namePrefix = `soccer-stats-ui-${stack}`;
