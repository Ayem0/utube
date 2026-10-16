import type { WSEvent } from '@repo/types/schemas/ws-events';
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
} from 'react';
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

export function useWs<T extends WSEvent['type']>(
  type: T,
  handler: (event: Extract<WSEvent, { type: T }>) => void,
) {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WSProvider');

  const onMessage = useEffectEvent(handler);
  useEffect(() => {
    const unsubscribe = ctx.ws.subscribe(type, (event) => {
      onMessage(event);
    });
    return () => {
      unsubscribe();
    };
  });
}
