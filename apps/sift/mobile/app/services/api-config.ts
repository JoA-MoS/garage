import { Platform } from 'react-native';

const LOCAL_API_PORT = 3334;

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getSiftApiBaseUrl(): string {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) {
    return normalizeBaseUrl(explicitUrl);
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${LOCAL_API_PORT}/api`;
  }

  return `http://localhost:${LOCAL_API_PORT}/api`;
}
