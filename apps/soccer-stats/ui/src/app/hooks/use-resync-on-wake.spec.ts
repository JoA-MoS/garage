import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useResyncOnWake } from './use-resync-on-wake';

const mockRefetchQueries = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({
    refetchQueries: mockRefetchQueries,
  }),
}));

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

describe('useResyncOnWake', () => {
  beforeEach(() => {
    mockRefetchQueries.mockClear();
    setVisibility('visible');
  });

  it('refetches active queries when the tab becomes visible again', () => {
    renderHook(() => useResyncOnWake());

    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' });
  });

  it('does not refetch when the visibilitychange fires while hidden', () => {
    renderHook(() => useResyncOnWake());

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockRefetchQueries).not.toHaveBeenCalled();
  });

  it('refetches on pageshow (bfcache restore)', () => {
    renderHook(() => useResyncOnWake());

    window.dispatchEvent(new Event('pageshow'));

    expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' });
  });

  it('refetches when connectivity is restored', () => {
    renderHook(() => useResyncOnWake());

    window.dispatchEvent(new Event('online'));

    expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' });
  });

  it('removes all listeners on unmount', () => {
    const { unmount } = renderHook(() => useResyncOnWake());
    unmount();

    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('online'));

    expect(mockRefetchQueries).not.toHaveBeenCalled();
  });
});
