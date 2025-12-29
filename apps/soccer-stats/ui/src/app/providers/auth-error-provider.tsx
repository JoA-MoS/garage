import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from '@clerk/clerk-react';

import { setAuthErrorHandler } from '../services/apollo-client';

interface AuthErrorContextValue {
  authError: string | null;
  clearAuthError: () => void;
}

const AuthErrorContext = createContext<AuthErrorContextValue | null>(null);

export function useAuthError() {
  const context = useContext(AuthErrorContext);
  if (!context) {
    throw new Error('useAuthError must be used within AuthErrorProvider');
  }
  return context;
}

interface AuthErrorProviderProps {
  children: ReactNode;
}

/**
 * Top-level provider that handles authentication errors from GraphQL.
 * When an UNAUTHENTICATED error occurs, it signs the user out and shows an error screen.
 */
export function AuthErrorProvider({ children }: AuthErrorProviderProps) {
  const { signOut } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  useEffect(() => {
    setAuthErrorHandler(() => {
      console.warn('Authentication error detected, signing out...');
      setAuthError('Your session has expired. Please sign in again.');
      // Sign out after a brief delay to show the error message
      setTimeout(async () => {
        try {
          await signOut({ redirectUrl: '/' });
        } catch (error) {
          console.error('Failed to sign out:', error);
          // Force navigation as fallback if signOut fails
          window.location.href = '/';
        }
      }, 2000);
    });

    // Cleanup: clear handler on unmount to prevent stale references
    return () => {
      setAuthErrorHandler(null);
    };
  }, [signOut]);

  // Show error screen when auth error occurs
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
          <svg
            className="mx-auto h-16 w-16 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Session Expired
          </h2>
          <p className="mt-2 text-gray-600">{authError}</p>
          <p className="mt-4 text-sm text-gray-500">
            Redirecting to sign in...
          </p>
          <div className="mt-4">
            <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full animate-pulse bg-amber-500"
                style={{ animation: 'progress 2s linear' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthErrorContext.Provider value={{ authError, clearAuthError }}>
      {children}
    </AuthErrorContext.Provider>
  );
}
