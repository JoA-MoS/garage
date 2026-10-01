import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { notifyTransportReconnect } from '../services/transport-reconnect';

import { useResyncOnWake } from './use-resync-on-wake';

const mockRefetchQueries = vi.fn().mockResolvedValue([]);
const mockClient = { refetchQueries: mockRefetchQueries };

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => mockClient,
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

  it('does not throw an unhandled rejection when refetchQueries fails', async () => {
    mockRefetchQueries.mockRejectedValueOnce(new Error('network down'));
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderHook(() => useResyncOnWake());

    document.dispatchEvent(new Event('visibilitychange'));

    // Flush the rejected promise's microtask queue
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Resync on Wake] Failed to refetch queries:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('runs the wake callback alongside the active-query refetch', () => {
    const onWake = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useResyncOnWake(onWake));
    window.dispatchEvent(new Event('online'));
    expect(onWake).toHaveBeenCalledTimes(1);
    expect(mockRefetchQueries).toHaveBeenCalledTimes(1);
  });

  it("resyncs when its own client's subscription socket reconnects", () => {
    renderHook(() => useResyncOnWake());
    notifyTransportReconnect({});
    expect(mockRefetchQueries).not.toHaveBeenCalled();
    notifyTransportReconnect(mockClient);
    expect(mockRefetchQueries).toHaveBeenCalledTimes(1);
  });

  it('removes all listeners on unmount', () => {
    const { unmount } = renderHook(() => useResyncOnWake());
    unmount();

    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('online'));
    notifyTransportReconnect(mockClient);

    expect(mockRefetchQueries).not.toHaveBeenCalled();
  });
});
