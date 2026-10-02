import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const stack = pulumi.getStack();

export const containerPort = config.getNumber('containerPort') || 3333;

// Clerk authentication (required)
export const clerkSecretKey = config.requireSecret('clerkSecretKey');
export const clerkPublishableKey = config.require('clerkPublishableKey');

// CORS configuration
export const frontendUrl = config.get('frontendUrl');

// Database connection pool configuration
export const dbPoolMax = config.getNumber('dbPoolMax') || 10;
// Must stay 0 in AWS: Aurora Serverless v2 can't auto-pause while any pooled
// connection is held open. `??` so an explicit 0 isn't coerced back.
export const dbPoolMin = config.getNumber('dbPoolMin') ?? 0;
export const dbPoolIdleTimeout = config.getNumber('dbPoolIdleTimeout') || 30000;
export const dbPoolConnectionTimeout =
  config.getNumber('dbPoolConnectionTimeout') || 45000;

// Observability configuration
export const observabilityLogLevel =
  config.get('observabilityLogLevel') || 'none';
export const slowQueryThresholdMs =
  config.getNumber('slowQueryThresholdMs') || 1000;
export const queryComplexityLimit =
  config.getNumber('queryComplexityLimit') || 100;
export const dataLoaderBatchSizeWarning =
  config.getNumber('dataLoaderBatchSizeWarning') || 100;

export const namePrefix = `soccer-stats-api-${stack}`;
