import type { WSEvent } from '@repo/types/schemas/ws-events';
import { wsEvent } from '@repo/types/schemas/ws-events';

export class WS {
  private socket: WebSocket | null = null;
  private listeners = new Map<WSEvent['type'], Set<(data: WSEvent) => void>>();
  constructor(readonly url: string) {}

  public connect() {
    if (this.socket) return;

    this.socket = new WebSocket(this.url);
    this.socket.onmessage = this.onMessage;
    this.socket.onopen = () => {
      console.log('Websocket connected');
    };
    this.socket.onclose = () => {
      console.log('Websocket disconnected');
      this.socket = null;
    };
    this.socket.onerror = () => {
      console.error('Websocket error');
    };
  }

  public close() {
    if (!this.socket) return;

    this.socket.close(1000, 'User logged out.');
  }

  private onMessage = (e: MessageEvent<string>) => {
    console.log('RECEIVED WS MSG', e.data);
    try {
      const msg = JSON.parse(e.data);
      const event = wsEvent.parse(msg);

      const listeners = this.listeners.get(event.type);
      if (!listeners) return;

      for (const listener of listeners) {
        listener(event);
      }
    } catch (err) {
      console.error('Failed to parse websocket message: ', err);
    }
  };

  public subscribe<T extends WSEvent['type']>(
    type: T,
    cb: (data: Extract<WSEvent, { type: T }>) => void,
  ) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(cb as (data: WSEvent) => void);

    return () => {
      this.listeners.get(type)?.delete(cb as (data: WSEvent) => void);
    };
  }
}
