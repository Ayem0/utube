import { createReactiveRuntime, Signal, type ReadOnlySignal } from "./runtime";

export class Store<T extends Record<PropertyKey, unknown>> {
  private runtime = createReactiveRuntime();
  private state: BranchSignal<T>;
  /**
   *
   */
  constructor(initial: T) {
    this.state = this.createDeepSignal(initial) as BranchSignal<T>;
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

  public select<S>(selector: (value: BranchSignal<T>) => DeepSignal<S>) {
    return selector(this.state);
  }

  public set<S>(selector: (value: BranchSignal<T>) => DeepSignal<S>, value: S) {
    selector(this.state)(value);
  }

  /**
   * Bridge for react useSyncExternalStore
   * @param selector selector of the signal tree
   * @returns the selected signal value
   */
  public use<S>(selector: (value: DeepSignal<T>) => DeepSignal<S>) {
    const signal = selector(this.state);

    let initialized = false;
    let current!: S;

    const read = () => {
      current = signal();
      initialized = true;
      return current;
    };

    return {
      getSnapshot: () => {
        if (!initialized) {
          return read();
        }

        return current;
      },

      subscribe: (listener: () => void) => {
        return this.runtime.effect(() => {
          const next = signal();

          if (!initialized) {
            current = next;
            initialized = true;
            return;
          }

          if (!Object.is(current, next)) {
            current = next;
            listener();
          }
        });
      },
    };
  }

  public batch = this.runtime.batch;
  public effect = this.runtime.effect;
  public signal = this.runtime.signal;
  public computed = this.runtime.computed;
}

export type DeepSignal<T> = [T] extends [object] ? BranchSignal<T> : Signal<T>;

type BranchSignal<T extends object> = Signal<T> & {
  [K in keyof T]: DeepSignal<T[K]>;
};

export type ReadOnlyDeepSignal<T> = [T] extends [object]
  ? ReadOnlyBranchSignal<T>
  : ReadOnlySignal<T>;
type ReadOnlyBranchSignal<T extends object> = ReadOnlySignal<T> & {
  [K in keyof T]: ReadOnlyDeepSignal<T[K]>;
};
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function createStore<T extends Record<PropertyKey, unknown>>(
  initial: T,
) {
  return new Store(initial);
}
