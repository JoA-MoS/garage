import { SignedIn, SignedOut } from '@clerk/clerk-react';

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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access the Soccer Stats application.
            </p>
          </div>
        </div>
      </SignedOut>
    </>
  );
};
