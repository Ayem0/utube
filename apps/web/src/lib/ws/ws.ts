import type { WSEvent } from '@repo/types/schemas/ws-events';
import { wsEvent } from '@repo/types/schemas/ws-events';

export class WS {
  private socket: WebSocket | null = null;
  private listeners = new Map<WSEvent['type'], Set<(data: WSEvent) => void>>();
  constructor(readonly url: string) {}

  public connect() {
    const current = this.socket;
    if (
      current?.readyState === WebSocket.OPEN ||
      current?.readyState === WebSocket.CONNECTING
    ) {
      console.log('this socket exists returning');
      return;
    }

    const socket = new WebSocket(this.url);

    this.socket = socket;
    socket.onmessage = this.onMessage;
    socket.onopen = () => {
      console.log('Websocket connected');
    };
    socket.onclose = (ev) => {
      console.log('Websocket disconnected', ev.code, ev.reason, ev.wasClean);
      if (this.socket === socket) {
        this.socket = null;
      }
    };
    socket.onerror = (ev) => {
      console.error('Websocket error', ev);
    };
  }

  public close() {
    console.log('called close');
    const socket = this.socket;

    if (!socket) return;

    this.socket = null;

    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => {
        socket.close(1000, 'No longer needed.');
      };
      return;
    }
    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'User logged out.');
    }
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
