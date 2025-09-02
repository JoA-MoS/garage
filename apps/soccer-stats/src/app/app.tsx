import { 
  ClerkLoaded, 
  ClerkLoading, 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn 
} from '@clerk/clerk-react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router';

// Loading component for Clerk initialization
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
  </div>
);

export function App() {
  return (
    <>
      <ClerkLoading>
        <LoadingSpinner />
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          <RouterProvider router={router} />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn redirectUrl="/" />
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}

export default App;
