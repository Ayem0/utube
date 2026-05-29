import { ws } from '@/lib/ws/ws';
import type { User } from '@repo/auth/user';
import { useEffect } from 'react';

export function WS({
  children,
  user,
}: {
  user: User | undefined;
  children: React.ReactNode;
}) {
  useEffect(() => {
    ws.on('connect', () => {
      console.log('socket connected', ws.id);
    });

    ws.on('connect_error', (err) => {
      console.error('socket connect_error', err.message, err);
    });

    ws.io.on('error', (err) => {
      console.error('manager error', err);
    });
    if (!user) {
      ws.disconnect();
    } else {
      ws.connect();
    }
  }, [user]);
  return <>{children}</>;
}
