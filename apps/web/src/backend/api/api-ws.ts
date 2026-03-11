import Elysia from 'elysia';
import { authPlugin } from './api-auth';

export const apiWs = new Elysia().use(authPlugin).ws('/ws', {
  auth: true,
  open: (ws) => {
    const userId = ws.data.user.id;
    ws.subscribe(`user:${userId}`);
  },
  message: (ws, message) => {},

  close: (ws) => {
    const userId = ws.data.user.id;
    ws.unsubscribe(`user:${userId}`);
  },
});
