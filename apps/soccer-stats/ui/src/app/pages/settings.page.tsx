import { useEffect, useState } from 'react';

import {
  fetchApiBuildInfo,
  getUiBuildInfo,
} from '../services/build-info.service';
import type { BuildInfo } from '../services/build-info.service';

function formatBuildTime(buildTime: string): string {
  if (buildTime === 'unknown') {
    return 'unknown';
  }

  const date = new Date(buildTime);
  if (Number.isNaN(date.getTime())) {
    return buildTime;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function BuildInfoCard({ label, info }: { label: string; info: BuildInfo }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
        {label}
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Version</dt>
          <dd className="font-mono text-gray-900">{info.version}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Git SHA</dt>
          <dd className="font-mono text-gray-900">{info.gitSha}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Built</dt>
          <dd className="font-mono text-gray-900">
            {formatBuildTime(info.buildTime)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Environment</dt>
          <dd className="font-mono text-gray-900">{info.environment}</dd>
        </div>
      </dl>
    </div>
  );
}

function BuildInfoPanel() {
  const [apiBuildInfo, setApiBuildInfo] = useState<BuildInfo | null>(null);
  const [apiBuildInfoError, setApiBuildInfoError] = useState<string | null>(
    null,
  );
  const uiBuildInfo = getUiBuildInfo();

  useEffect(() => {
    let isMounted = true;

    fetchApiBuildInfo()
      .then((info) => {
        if (isMounted) {
          setApiBuildInfo(info);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setApiBuildInfoError(
            error instanceof Error ? error.message : String(error),
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Build Info</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BuildInfoCard label="UI" info={uiBuildInfo} />
        {apiBuildInfo ? (
          <BuildInfoCard label="API" info={apiBuildInfo} />
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              API
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              {apiBuildInfoError ?? 'Loading API build info…'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Application settings page
 */
export const SettingsPage = () => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure application preferences and defaults
        </p>
      </div>

      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Game Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Default Game Duration
                </label>
                <p className="text-sm text-gray-500">
                  Default length for new games
                </p>
              </div>
              <select className="min-h-[44px] min-w-[44px] rounded-md border border-gray-300 px-3 py-2">
                <option value="90">90 minutes</option>
                <option value="80">80 minutes</option>
                <option value="70">70 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-save Games
                </label>
                <p className="text-sm text-gray-500">
                  Automatically save game progress
                </p>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Display Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Theme
                </label>
                <p className="text-sm text-gray-500">
                  Choose your preferred color scheme
                </p>
              </div>
              <select className="min-h-[44px] min-w-[44px] rounded-md border border-gray-300 px-3 py-2">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Data Management
          </h2>
          <div className="space-y-4">
            <button className="min-h-[44px] min-w-[44px] rounded-md bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700">
              Export Game Data
            </button>
            <button className="ml-3 min-h-[44px] min-w-[44px] rounded-md bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-700">
              Clear All Data
            </button>
          </div>
        </div>

        <BuildInfoPanel />
      </div>
    </div>
  );
};
