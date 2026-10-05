import { createContext, useContext, useEffect, useMemo } from 'react';
import { WS } from './ws';

const WSContext = createContext<{ ws: WS } | null>(null);

export const WSProvider = ({
  userId,
  url,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
  url: string;
}) => {
  const ws = useMemo(() => new WS(url), [url]);
  useEffect(() => {
    if (userId) {
      ws.connect();
    } else {
      ws.close();
    }
    return () => ws.close();
  }, [userId, ws]);

  return <WSContext.Provider value={{ ws }}>{children}</WSContext.Provider>;
};

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WSProvider');
  return ctx.ws;
}
