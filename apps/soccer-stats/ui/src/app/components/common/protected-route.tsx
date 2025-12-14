import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Component that protects routes and only shows content to authenticated users
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🔒</div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Authentication Required
            </h2>
            <p className="mb-6 text-gray-600">
              Please sign in to access the Soccer Stats application.
            </p>
            <div className="flex justify-center gap-4">
              <SignInButton>
                <button className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
};
