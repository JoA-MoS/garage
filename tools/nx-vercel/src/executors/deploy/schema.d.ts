export interface DeployExecutorSchema {
  /** Path to the build output directory (e.g., dist/apps/my-app) */
  outputPath: string;
  /** Vercel project name. Defaults to the Nx project name. */
  projectName?: string;
  /** Deploy to production. When false, creates a preview deployment. */
  prod?: boolean;
  /** Vercel API token. Falls back to VERCEL_TOKEN environment variable. */
  token?: string;
  /** Vercel organization/team ID. Falls back to VERCEL_ORG_ID environment variable. */
  org?: string;
  /** Vercel project ID. Falls back to VERCEL_PROJECT_ID environment variable. */
  projectId?: string;
}
