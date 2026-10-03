import { SignInButton, SignUpButton } from '@clerk/clerk-react';

import { OfflineSessionBanner } from '../../auth/offline-session-banner';
import { useSession } from '../../auth/session';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Component that protects routes and only shows content to authenticated users
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn, isOffline } = useSession();

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-16" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <>
        {isOffline && <OfflineSessionBanner />}
        {children}
      </>
    );
  }

  if (isOffline) {
    return (
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-bold text-gray-900">You're offline</h2>
        <p className="mt-2 text-gray-600">
          Signing in needs a connection. Try again once you have signal.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 min-h-[44px] rounded-md bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 px-8 py-10 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl shadow-inner backdrop-blur">
            <span role="img" aria-label="Locked">
              🔒
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight">
            Sign in to continue
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-blue-100">
            Team pages include roster, game, and statistics controls. We keep
            those behind your account instead of leaving them on the touchline.
          </p>
        </div>

        <div className="space-y-4 px-8 py-7">
          <SignInButton>
            <button className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Create Account
            </button>
          </SignUpButton>
          <p className="text-center text-xs text-slate-500">
            Use the same account you use for Soccer Stats.
          </p>
        </div>
      </div>
    </div>
  );
};
