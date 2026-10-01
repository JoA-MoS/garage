import { ApolloProvider } from '@apollo/client/react';
import { useAuth } from '@clerk/clerk-react';
import { ReactNode, useEffect, useMemo, useRef } from 'react';

import { createSessionApolloClient } from '../services/apollo-client';

type Session = ReturnType<typeof createSessionApolloClient>;

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const { getToken, userId, sessionId } = useAuth();
  const identity = JSON.stringify([userId, sessionId]);
  const current = useRef(identity);
  current.current = identity;
  const session = useMemo(
    () =>
      createSessionApolloClient(async () => {
        if (current.current !== identity) throw new Error('Account changed');
        const token = await getToken();
        if (current.current !== identity) throw new Error('Account changed');
        return token;
      }),
    [identity, getToken],
  );

  // Defer disposal by a tick: StrictMode runs effect cleanup and setup back to
  // back on the same memoized session, and an immediate dispose would leave the
  // remounted tree with a stopped client and a dead subscription socket. Only
  // the session that scheduled the dispose may cancel it, so an identity change
  // still disposes the previous session.
  const pendingDispose = useRef<{
    session: Session;
    timer: ReturnType<typeof setTimeout>;
  }>();
  useEffect(() => {
    if (pendingDispose.current?.session === session) {
      clearTimeout(pendingDispose.current.timer);
      pendingDispose.current = undefined;
    }
    return () => {
      pendingDispose.current = {
        session,
        timer: setTimeout(() => session.dispose(), 0),
      };
    };
  }, [session]);

  // Render while Clerk loads: queries already skip until auth is loaded, and
  // SignedIn/SignedOut gate private UI. The key remounts the tree when the
  // identity changes so no cached data crosses accounts.
  return (
    <ApolloProvider key={identity} client={session.client}>
      {children}
    </ApolloProvider>
  );
};
