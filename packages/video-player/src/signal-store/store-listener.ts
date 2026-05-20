type Listener = () => void;

type StateSetArg<T> = [T] extends [object] ? Partial<T> : T;

export type State<T> = {
  get(): T;
  set(value: StateSetArg<T>): void;
  subscribe(listener: Listener): () => void;
};

export type DeepState<T> = [T] extends [object] ? BranchState<T> : State<T>;

export type BranchState<T extends object> = State<T> & {
  [K in keyof T]: DeepState<T[K]>;
};

export class Store<T> {
  private state: DeepState<T>;

  private batchDepth = 0;
  private pending = new Set<Listener>();

  constructor(initial: T) {
    this.state = this.createDeepState(initial, () => {});
  }

  private createDeepState<V>(initial: V, notifyParent: Listener): DeepState<V> {
    if (!isPlainObject(initial)) {
      return this.createLeafState(initial, notifyParent) as DeepState<V>;
    }

    return this.createBranchState(initial, notifyParent) as DeepState<V>;
  }

  private createLeafState<V>(initial: V, notifyParent: Listener): State<V> {
    let current = initial;
    const listeners = new Set<Listener>();

    const flush = () => {
      for (const listener of [...listeners]) {
        listener();
      }
    };

    const notify = () => {
      notifyParent();
      this.schedule(flush);
    };

    return {
      get() {
        return current;
      },

      set(value: V) {
        if (Object.is(current, value)) return;

        current = value;
        notify();
      },

      subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    } as State<V>;
  }

  private createBranchState<V extends object>(
    initial: V,
    notifyParent: Listener,
  ): BranchState<V> {
    const keys = Object.keys(initial) as Array<keyof V>;
    const listeners = new Set<Listener>();

    const children = {} as {
      [K in keyof V]: DeepState<V[K]>;
    };

    let current = { ...initial } as V;

    const flush = () => {
      for (const listener of [...listeners]) {
        listener();
      }
    };

    const notify = () => {
      notifyParent();
      this.schedule(flush);
    };

    for (const key of keys) {
      children[key] = this.createDeepState(initial[key], () => {
        const next = children[key].get() as V[typeof key];

        if (Object.is(current[key], next)) return;

        current = {
          ...current,
          [key]: next,
        };

        notify();
      });
    }

    const branch: State<V> = {
      get() {
        return current;
      },

      set: (value: Partial<V>) => {
        this.batch(() => {
          for (const key of Object.keys(value) as Array<keyof V>) {
            if (!Object.prototype.hasOwnProperty.call(children, key)) {
              continue;
            }

            children[key].set(value[key] as never);
          }
        });
      },

      subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    } as State<V>;

    Object.assign(branch, children);

    return branch as BranchState<V>;
  }

  private schedule(listener: Listener) {
    if (this.batchDepth > 0) {
      this.pending.add(listener);
      return;
    }

    listener();
  }

  public batch = (fn: () => void) => {
    this.batchDepth++;

    try {
      fn();
    } finally {
      this.batchDepth--;

      if (this.batchDepth === 0) {
        while (this.pending.size > 0) {
          const listeners = [...this.pending];
          this.pending.clear();

          for (const listener of listeners) {
            listener();
          }
        }
      }
    }
  };

  /**
   * @internal Allows access to the entire state tree.
   */
  public get value(): DeepState<T> {
    return this.state;
  }

  public subscribe<S>(
    selector: (value: DeepState<T>) => DeepState<S>,
    listener: Listener,
  ) {
    const selected = selector(this.state);

    // Matches your effect-based version: listener runs once on subscribe.
    listener();

    return selected.subscribe(listener);
  }

  public getSnapshot<S>(selector: (value: DeepState<T>) => DeepState<S>): S {
    return selector(this.state).get();
  }
}

export function createStore<T>(initial: T) {
  return new Store(initial);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
