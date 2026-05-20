import { createReactiveRuntime, Signal } from "./runtime";

export class Store<T> {
  private runtime = createReactiveRuntime();
  private state;
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

  private createBranchSignal<V extends object>(initial: V): DeepSignal<V> {
    const keys = Object.keys(initial) as Array<keyof V>;
    const children = {} as {
      [K in keyof V]: DeepSignal<V[K]>;
    };

    for (const key of keys) {
      children[key] = this.createDeepSignal(initial[key]);
    }

    return children as DeepSignal<V>;
  }

  public get value(): DeepSignal<T> {
    return this.state;
  }

  public subscribe<S>(
    selector: (value: DeepSignal<T>) => Signal<S>,
    listener: () => void,
  ) {
    return this.runtime.effect(() => {
      selector(this.state)();
      listener();
    });
  }

  public get<S>(selector: (value: DeepSignal<T>) => Signal<S>): Signal<S> {
    return selector(this.state);
  }

  public set<S>(selector: (value: DeepSignal<T>) => Signal<S>, value: S) {
    selector(this.state)(value);
  }

  public getSnapshot<S>(selector: (value: DeepSignal<T>) => Signal<S>): S {
    return selector(this.state)();
  }

  //   public use<S>(
  //     selector: (value: DeepSignal<T>) => Signal<S>,
  //     listener: () => void,
  //   ) {
  //     let value: S;
  //     const effect = this.runtime.effect(() => {
  //       value = selector(this.state)();
  //       listener();
  //     });
  //     return {
  //       snapshot: () => value,
  //       subscribe: effect,
  //     };
  //   }

  public batch = this.runtime.batch;
  public effect = this.runtime.effect;
  public signal = this.runtime.signal;
  public computed = this.runtime.computed;
}

type DeepSignal<T> = [T] extends [object]
  ? { [K in keyof T]: DeepSignal<T[K]> }
  : Signal<T>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function createStore<T>(initial: T) {
  return new Store(initial);
}
