import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { vi } from 'vitest';

import App from './app';

// Mock Clerk authentication
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should display game setup configuration', () => {
    const { getByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(getByText('Game Setup')).toBeTruthy();
    expect(getByText('Quick Setup with Test Data')).toBeTruthy();
  });
});
