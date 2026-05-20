import { createReactiveRuntime, Signal } from "./runtime";

export class Store<T> {
  private runtime = createReactiveRuntime();
  private state: DeepSignal<T>;
  /**
   *
   */
  constructor(initial: T) {
    this.state = this.createDeepSignal(initial);
  }

  private createDeepSignal<V>(initial: V): DeepSignal<V> {
    if (!isPlainObject(initial))
      return this.runtime.signal(initial) as DeepSignal<V>;

    return this.createBranchSignal(initial) as DeepSignal<V>;
  }

  private createBranchSignal<V extends object>(initial: V): BranchSignal<V> {
    const keys = Object.keys(initial) as Array<keyof V>;
    const children = {} as {
      [K in keyof V]: DeepSignal<V[K]>;
    };

    for (const key of keys) {
      children[key] = this.createDeepSignal(initial[key]);
    }

    const read = this.runtime.computed(() => {
      const out = {} as {
        [K in keyof V]: V[K];
      };
      for (const key of keys) {
        out[key] = children[key]() as V[typeof key];
      }
      return out;
    });

    const runtime = this.runtime;

    function branch(): V;
    function branch(value: V): void;
    function branch(...args: [] | [V]) {
      if (args.length === 0) {
        return read();
      }

      const value = args[0];

      runtime.batch(() => {
        for (const key of keys) {
          children[key](value[key] as any);
        }
      });
    }

    Object.assign(branch, children);

    return branch as BranchSignal<V>;
  }

  /**
   * @internal Allows to get the entire state, use only for debug purposes
   */
  public get value(): DeepSignal<T> {
    return this.state;
  }

  public subscribe<S>(
    selector: (value: DeepSignal<T>) => DeepSignal<S>,
    listener: () => void,
  ) {
    return this.runtime.effect(() => {
      selector(this.state)();
      listener();
    });
  }

  public getSnapshot<S>(selector: (value: DeepSignal<T>) => DeepSignal<S>): S {
    return selector(this.state)();
  }

  public batch = this.runtime.batch;
  public effect = this.runtime.effect;
  public signal = this.runtime.signal;
  public computed = this.runtime.computed;
}

export type DeepSignal<T> = [T] extends [object] ? BranchSignal<T> : Signal<T>;

type BranchSignal<T extends object> = {
  (): T;
  (value: T): void;
} & {
  [K in keyof T]: DeepSignal<T[K]>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function createStore<T>(initial: T) {
  return new Store(initial);
}
