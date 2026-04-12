export abstract class EventEmitter<
  EventMap extends Record<keyof EventMap, any[]> = {},
> {
  private listeners: {
    [K in keyof EventMap]?: Array<(...args: EventMap[K]) => void>;
  } = {};

  public on<K extends keyof EventMap>(
    event: K,
    handler: (...args: EventMap[K]) => void,
  ) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return this;
  }

  protected emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]) {
    this.listeners[event]?.forEach((listener) => listener(...args));
  }

  public off<K extends keyof EventMap>(
    event: K,
    handler: (...args: EventMap[K]) => void,
  ) {
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== handler);
    return this;
  }
  protected clearListeners() {
    this.listeners = {};
  }
}
