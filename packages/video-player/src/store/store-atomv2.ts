type Atomized<T> = [T] extends [object]
  ? Computed<T> & {
      [K in keyof T]: Atomized<T[K]>;
    }
  : Atom<T>;

type ExampleState = {
  playback: {
    paused: boolean;
    ended: boolean;
    rate: number;
  };
  volume: {
    muted: boolean;
    volume: number;
  };
  display: {
    fullscreen: boolean;
    pip: boolean;
  };
  userActivity: {
    isFocused: boolean;
    isMouseOver: boolean;
    idle: boolean;
  };
  timeLine: {
    something: {
      else: string;
      or: number;
    };
    isHovering: boolean;
    isDragging: boolean;
  };
};

const t: Atomized<ExampleState> = {
  display: {
    fullscreen: atom(false),
    pip: atom(false),
  },
  playback: {
    paused: atom(false),
    ended: atom(false),
    rate: atom(1),
  },
  volume: {
    muted: atom(false),
    volume: atom(1),
  },
};

function computed<T>(getter: () => T): Computed<T> {
  return { get: getter };
}

function atom<T>(value: T): Atom<T> {
  return new Atom(value);
}

class Atom<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }

  public set(updater: T | ((prev?: T) => T)) {
    this.value =
      typeof updater === "function"
        ? (updater as (prev?: T) => T)(this.value)
        : updater;
  }
  public get() {
    return this.value;
  }
}

class Computed<T> {
  private value: T;
  constructor(getter: () => T, deps: Atom<T>[]) {
    this.value = getter();
    this.deps = deps;
  }

  public get() {
    return this.value;
  }
}
