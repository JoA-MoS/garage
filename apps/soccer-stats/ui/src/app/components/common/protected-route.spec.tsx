import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { Session } from '../../auth/session';

import { ProtectedRoute } from './protected-route';

let session: Session;
vi.mock('../../auth/session', () => ({ useSession: () => session }));
vi.mock('@clerk/clerk-react', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
}));

function renderRoute() {
  return render(
    <ProtectedRoute>
      <p>Saved games</p>
    </ProtectedRoute>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    session = {
      isLoaded: true,
      userId: 'u1',
      isSignedIn: true,
      isOffline: false,
    };
  });

  it('shows a loading state, not a blank page, while waiting for Clerk', () => {
    session = { ...session, isLoaded: false, userId: null, isSignedIn: false };
    renderRoute();

    expect(screen.getByRole('status').textContent).toContain('Loading');
    expect(screen.queryByText('Saved games')).toBeNull();
  });

  it('shows the page without a banner when signed in normally', () => {
    renderRoute();

    expect(screen.getByText('Saved games')).toBeTruthy();
    expect(screen.queryByText(/Offline/)).toBeNull();
  });

  it('shows saved data with a banner on the offline session', () => {
    session = { ...session, isOffline: true };
    renderRoute();

    expect(screen.getByText('Saved games')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      'Offline — showing saved data; changes will sync.',
    );
  });

  it('explains that signing in needs a connection when offline with nobody to fall back to', () => {
    session = {
      isLoaded: true,
      userId: null,
      isSignedIn: false,
      isOffline: true,
    };
    renderRoute();

    expect(screen.getByText("You're offline")).toBeTruthy();
    expect(screen.queryByText('Saved games')).toBeNull();
  });

  it('asks a signed-out user to sign in', () => {
    session = { ...session, userId: null, isSignedIn: false };
    renderRoute();

    expect(screen.getByText('Sign in to continue')).toBeTruthy();
  });
});
