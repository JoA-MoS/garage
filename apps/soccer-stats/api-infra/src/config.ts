import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const stack = pulumi.getStack();

// Container configuration
export const containerPort = config.getNumber('containerPort') || 3333;
export const cpu = config.getNumber('cpu') || 256; // 0.25 vCPU
export const memory = config.getNumber('memory') || 512; // 512 MB
export const desiredCount = config.getNumber('desiredCount') || 1;

// Auto-scaling configuration
export const minCapacity = config.getNumber('minCapacity') || 1;
export const maxCapacity = config.getNumber('maxCapacity') || 4;
export const cpuTargetUtilization =
  config.getNumber('cpuTargetUtilization') || 70;

// Clerk authentication (required)
export const clerkSecretKey = config.requireSecret('clerkSecretKey');
export const clerkPublishableKey = config.require('clerkPublishableKey');

// CORS configuration - comma-separated list of allowed origins (optional)
// If not set, API allows all origins (safe when behind CloudFront)
export const frontendUrl = config.get('frontendUrl');

// Naming convention
export const namePrefix = `soccer-stats-api-${stack}`;
