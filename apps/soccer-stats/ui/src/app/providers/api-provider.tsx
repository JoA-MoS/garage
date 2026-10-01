import { ApolloProvider } from '@apollo/client/react';
import { useAuth } from '@clerk/clerk-react';
import { ReactNode, useEffect, useMemo, useRef } from 'react';

import { createSessionApolloClient } from '../services/apollo-client';

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const { getToken, userId, sessionId, isLoaded } = useAuth();
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
  useEffect(() => () => session.dispose(), [session]);
  if (!isLoaded) return null;
  return (
    <ApolloProvider key={identity} client={session.client}>
      {children}
    </ApolloProvider>
  );
};
