const SERVICE_WORKER_URL = '/sw.js';

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => {
      console.error('Failed to register service worker:', error);
    });
  });
}
