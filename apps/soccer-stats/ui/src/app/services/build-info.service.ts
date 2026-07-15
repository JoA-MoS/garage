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

  return response.json() as Promise<BuildInfo>;
}
