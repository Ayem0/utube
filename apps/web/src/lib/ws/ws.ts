import { io } from 'socket.io-client';

export const ws = io('http://localhost:3002', {
  withCredentials: true,
  autoConnect: false,
  transports: ['websocket'],
});
