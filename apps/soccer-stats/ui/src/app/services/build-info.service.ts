import { API_PREFIX, getApiUrl } from './environment';

export interface BuildInfo {
  name: string;
  version: string;
  gitSha: string;
  buildTime: string;
  environment: string;
}

export function getUiBuildInfo(): BuildInfo {
  return {
    name: 'soccer-stats-ui',
    version: __UI_VERSION__,
    gitSha: __GIT_SHA__,
    buildTime: __BUILD_TIME__,
    environment: __APP_ENVIRONMENT__,
  };
}

export async function fetchApiBuildInfo(): Promise<BuildInfo> {
  const apiUrl = getApiUrl();
  const versionUrl = `${apiUrl}/${API_PREFIX}/version`;
  const response = await fetch(versionUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch API build info: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('application/json')) {
    return response.json() as Promise<BuildInfo>;
  }

  return fetchApiBuildInfoFromHealth(apiUrl);
}

async function fetchApiBuildInfoFromHealth(apiUrl: string): Promise<BuildInfo> {
  const healthUrl = `${apiUrl}/${API_PREFIX}/health`;
  const response = await fetch(healthUrl);

  if (!response.ok) {
    throw new Error(
      `API build info unavailable: /${API_PREFIX}/version returned non-JSON and /${API_PREFIX}/health failed with ${response.status} ${response.statusText}`,
    );
  }

  const health = (await response.json()) as { build?: BuildInfo };
  if (!health.build) {
    throw new Error(
      `API build info unavailable: /${API_PREFIX}/version returned non-JSON and /${API_PREFIX}/health did not include build metadata`,
    );
  }

  return health.build;
}
