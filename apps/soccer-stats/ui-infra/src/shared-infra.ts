import { getSharedInfraStackReference } from './stack-reference';

// =============================================================================
// Import Shared Infrastructure
// =============================================================================
const sharedInfra = getSharedInfraStackReference();

// Get ALB details for API routing
export const albDnsName = sharedInfra.requireOutput('albDnsName');

// API will be accessible via CloudFront at /api/* (same origin as UI)
// This eliminates CORS issues and simplifies frontend configuration
