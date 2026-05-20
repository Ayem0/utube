// Adapted from Alien Signals
// https://github.com/stackblitz/alien-signals/

export interface ReactiveNode {
  deps?: Link;
  depsTail?: Link;
  subs?: Link;
  subsTail?: Link;
  flags: ReactiveFlags;
}

export interface Link {
  version: number;
  dep: ReactiveNode;
  sub: ReactiveNode;
  prevSub: Link | undefined;
  nextSub: Link | undefined;
  prevDep: Link | undefined;
  nextDep: Link | undefined;
}

interface Stack<T> {
  value: T;
  prev: Stack<T> | undefined;
}

export const enum ReactiveFlags {
  None = 0,
  Mutable = 1,
  Watching = 2,
  RecursedCheck = 4,
  Recursed = 8,
  Dirty = 16,
  Pending = 32,
}
/*@__NO_SIDE_EFFECTS__*/
export function createReactiveSystem({
  update,
  notify,
  unwatched,
}: {
  update(sub: ReactiveNode): boolean;
  notify(sub: ReactiveNode): void;
  unwatched(sub: ReactiveNode): void;
}) {
  return {
    link,
    unlink,
    propagate,
    checkDirty,
    shallowPropagate,
  };

  function link(dep: ReactiveNode, sub: ReactiveNode, version: number): void {
    const prevDep = sub.depsTail;
    if (prevDep !== undefined && prevDep.dep === dep) {
      return;
    }
    const nextDep = prevDep !== undefined ? prevDep.nextDep : sub.deps;
    if (nextDep !== undefined && nextDep.dep === dep) {
      nextDep.version = version;
      sub.depsTail = nextDep;
      return;
    }
    const prevSub = dep.subsTail;
    if (
      prevSub !== undefined &&
      prevSub.version === version &&
      prevSub.sub === sub
    ) {
      return;
    }
    const newLink =
      (sub.depsTail =
      dep.subsTail =
        {
          version,
          dep,
          sub,
          prevDep,
          nextDep,
          prevSub,
          nextSub: undefined,
        });
    if (nextDep !== undefined) {
      nextDep.prevDep = newLink;
    }
    if (prevDep !== undefined) {
      prevDep.nextDep = newLink;
    } else {
      sub.deps = newLink;
    }
    if (prevSub !== undefined) {
      prevSub.nextSub = newLink;
    } else {
      dep.subs = newLink;
    }
  }

  function unlink(link: Link, sub = link.sub): Link | undefined {
    const dep = link.dep;
    const prevDep = link.prevDep;
    const nextDep = link.nextDep;
    const nextSub = link.nextSub;
    const prevSub = link.prevSub;
    if (nextDep !== undefined) {
      nextDep.prevDep = prevDep;
    } else {
      sub.depsTail = prevDep;
    }
    if (prevDep !== undefined) {
      prevDep.nextDep = nextDep;
    } else {
      sub.deps = nextDep;
    }
    if (nextSub !== undefined) {
      nextSub.prevSub = prevSub;
    } else {
      dep.subsTail = prevSub;
    }
    if (prevSub !== undefined) {
      prevSub.nextSub = nextSub;
    } else if ((dep.subs = nextSub) === undefined) {
      unwatched(dep);
    }
    return nextDep;
  }

  function propagate(link: Link): void {
    let next = link.nextSub;
    let stack: Stack<Link | undefined> | undefined;

    top: do {
      const sub = link.sub;
      let flags = sub.flags;

      if (
        !(
          flags &
          (ReactiveFlags.RecursedCheck |
            ReactiveFlags.Recursed |
            ReactiveFlags.Dirty |
            ReactiveFlags.Pending)
        )
      ) {
        sub.flags = flags | ReactiveFlags.Pending;
      } else if (
        !(flags & (ReactiveFlags.RecursedCheck | ReactiveFlags.Recursed))
      ) {
        flags = ReactiveFlags.None;
      } else if (!(flags & ReactiveFlags.RecursedCheck)) {
        sub.flags = (flags & ~ReactiveFlags.Recursed) | ReactiveFlags.Pending;
      } else if (
        !(flags & (ReactiveFlags.Dirty | ReactiveFlags.Pending)) &&
        isValidLink(link, sub)
      ) {
        sub.flags = flags | (ReactiveFlags.Recursed | ReactiveFlags.Pending);
        flags &= ReactiveFlags.Mutable;
      } else {
        flags = ReactiveFlags.None;
      }

      if (flags & ReactiveFlags.Watching) {
        notify(sub);
      }

      if (flags & ReactiveFlags.Mutable) {
        const subSubs = sub.subs;
        if (subSubs !== undefined) {
          const nextSub = (link = subSubs).nextSub;
          if (nextSub !== undefined) {
            stack = { value: next, prev: stack };
            next = nextSub;
          }
          continue;
        }
      }

      if ((link = next!) !== undefined) {
        next = link.nextSub;
        continue;
      }

      while (stack !== undefined) {
        link = stack.value!;
        stack = stack.prev;
        if (link !== undefined) {
          next = link.nextSub;
          continue top;
        }
      }

      break;
    } while (true);
  }

  function checkDirty(link: Link, sub: ReactiveNode): boolean {
    let stack: Stack<Link> | undefined;
    let checkDepth = 0;
    let dirty = false;

    top: do {
      const dep = link.dep;
      const flags = dep.flags;

      if (sub.flags & ReactiveFlags.Dirty) {
        dirty = true;
      } else if (
        (flags & (ReactiveFlags.Mutable | ReactiveFlags.Dirty)) ===
        (ReactiveFlags.Mutable | ReactiveFlags.Dirty)
      ) {
        if (update(dep)) {
          const subs = dep.subs!;
          if (subs.nextSub !== undefined) {
            shallowPropagate(subs);
          }
          dirty = true;
        }
      } else if (
        (flags & (ReactiveFlags.Mutable | ReactiveFlags.Pending)) ===
        (ReactiveFlags.Mutable | ReactiveFlags.Pending)
      ) {
        if (link.nextSub !== undefined || link.prevSub !== undefined) {
          stack = { value: link, prev: stack };
        }
        link = dep.deps!;
        sub = dep;
        ++checkDepth;
        continue;
      }

      if (!dirty) {
        const nextDep = link.nextDep;
        if (nextDep !== undefined) {
          link = nextDep;
          continue;
        }
      }

      while (checkDepth--) {
        const firstSub = sub.subs!;
        const hasMultipleSubs = firstSub.nextSub !== undefined;
        if (hasMultipleSubs) {
          link = stack!.value;
          stack = stack!.prev;
        } else {
          link = firstSub;
        }
        if (dirty) {
          if (update(sub)) {
            if (hasMultipleSubs) {
              shallowPropagate(firstSub);
            }
            sub = link.sub;
            continue;
          }
          dirty = false;
        } else {
          sub.flags &= ~ReactiveFlags.Pending;
        }
        sub = link.sub;
        const nextDep = link.nextDep;
        if (nextDep !== undefined) {
          link = nextDep;
          continue top;
        }
      }

      return dirty;
    } while (true);
  }

  function shallowPropagate(link: Link): void {
    do {
      const sub = link.sub;
      const flags = sub.flags;
      if (
        (flags & (ReactiveFlags.Pending | ReactiveFlags.Dirty)) ===
        ReactiveFlags.Pending
      ) {
        sub.flags = flags | ReactiveFlags.Dirty;
        if (
          (flags & (ReactiveFlags.Watching | ReactiveFlags.RecursedCheck)) ===
          ReactiveFlags.Watching
        ) {
          notify(sub);
        }
      }
    } while ((link = link.nextSub!) !== undefined);
  }

  function isValidLink(checkLink: Link, sub: ReactiveNode): boolean {
    let link = sub.depsTail;
    while (link !== undefined) {
      if (link === checkLink) {
        return true;
      }
      link = link.prevDep;
    }
    return false;
  }
}

type Unsubscribe = () => void;
type Listener<T> = (value: T) => void;

interface Subscribable<T> {
  subscribe(listener: Listener<T>): Unsubscribe;
}
interface Readable<T> {
  get(): T;
}

interface BaseAtom<T> extends Subscribable<T>, Readable<T>, ReactiveNode {}
interface Atom<T> extends BaseAtom<T> {
  set(valueOrFn: T | ((prev: T) => T)): void;
}
interface ReadOnlyAtom<T> extends BaseAtom<T> {}

interface InternalAtom<T> extends ReactiveNode {
  _snapshot: T;
  _update: (valueOrFn?: T | ((prev: T) => T)) => boolean;
  get: () => T;
  subscribe: (listner: Listener<T>) => Unsubscribe;
}

interface Runtime {
  trackingId: number;
  activeSub: ReactiveNode | undefined;
  queue: Effect[];
  queuedLength: number;
  notifyIndex: number;
  batchDepth: number;
  cycle: number;
}

interface Effect extends ReactiveNode {
  notify: () => void;
  stop: () => void;
}

export class Store<T> {
  private runtime: Runtime = {
    trackingId: 0,
    activeSub: undefined,
    queue: [],
    queuedLength: 0,
    batchDepth: 0,
    notifyIndex: 0,
    cycle: 0,
  };

  private atom: Atom<T>;

  constructor(initialState: T) {
    this.atom = this.createAtom(initialState, this.runtime) as Atom<T>;
  }

  public subscribe = (listener: Listener<T>): Unsubscribe => {
    return this.atom.subscribe(listener);
  };

  public get = (): T => {
    return this.atom.get();
  };

  public set = (valueOrFn: T | ((prev: T) => T)): void => {
    this.atom.set(valueOrFn);
  };

  private createAtom<T>(
    valueOrFn: T | ((prev?: T) => T),
    runtime: Runtime,
  ): Atom<T> | ReadOnlyAtom<T> {
    const isComputed = typeof valueOrFn === "function";
    const getter = valueOrFn as (prev?: T) => T;

    const atom: InternalAtom<T> = {
      _snapshot: isComputed ? undefined! : valueOrFn,
      get: () => {
        if (runtime.activeSub) {
          this.system.link(atom, runtime.activeSub, runtime.cycle);
        }
        return atom._snapshot;
      },
      _update: (valueOrFn) => {
        const prevSub = runtime.activeSub;
        const compare = Object.is;
        if (isComputed) {
          runtime.activeSub = atom;
          runtime.cycle++;
          atom.depsTail = undefined;
        } else if (valueOrFn === undefined) {
          // Mutable atoms can be marked dirty by the reactive graph, but they should
          // never be recomputed without an explicit value/updater.
          return false;
        }
        if (isComputed) {
          atom.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck;
        }
        try {
          const oldValue = atom._snapshot;
          const newValue =
            typeof valueOrFn === "function"
              ? (valueOrFn as (snapshot: T) => T)(oldValue)
              : valueOrFn === undefined && isComputed
                ? getter(oldValue)
                : valueOrFn!;
          if (oldValue === undefined || !compare(oldValue, newValue)) {
            atom._snapshot = newValue;
            return true;
          }
          return false;
        } finally {
          runtime.activeSub = prevSub;
          if (isComputed) {
            atom.flags &= ~ReactiveFlags.RecursedCheck;
          }
          this.purgeDeps(atom);
        }
      },
      subscribe: (listener) => {
        const observed = { current: false };
        const e = this.effect(() => {
          atom.get();
          if (!observed.current) {
            observed.current = true;
          } else {
            listener(atom._snapshot);
          }
        });

        return e.stop;
      },
      deps: undefined,
      depsTail: undefined,
      subs: undefined,
      subsTail: undefined,
      flags: isComputed ? ReactiveFlags.None : ReactiveFlags.Mutable,
    };

    return atom;
  }

  private system = createReactiveSystem({
    update(atom: InternalAtom<any>): boolean {
      return atom._update();
    },
    notify: (effect: Effect): void => {
      this.runtime.queue[this.runtime.queuedLength++] = effect;
      effect.flags &= ~ReactiveFlags.Watching;
    },
    unwatched: (atom: InternalAtom<any>): void => {
      if (atom.depsTail !== undefined) {
        atom.depsTail = undefined;
        atom.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty;
        this.purgeDeps(atom);
      }
    },
  });

  private purgeDeps = (sub: ReactiveNode) => {
    const depsTail = sub.depsTail;
    let dep = depsTail !== undefined ? depsTail.nextDep : sub.deps;
    while (dep !== undefined) {
      dep = this.system.unlink(dep, sub);
    }
  };

  private effect<T>(fn: () => T): Effect {
    const that = this;
    const run = (): T => {
      const prevSub = that.runtime.activeSub;
      that.runtime.activeSub = effectObj;
      ++that.runtime.cycle;
      effectObj.depsTail = undefined;
      effectObj.flags = ReactiveFlags.Watching | ReactiveFlags.RecursedCheck;
      try {
        return fn();
      } finally {
        this.runtime.activeSub = prevSub;
        effectObj.flags &= ~ReactiveFlags.RecursedCheck;
        this.purgeDeps(effectObj);
      }
    };
    const effectObj: Effect = {
      deps: undefined,
      depsTail: undefined,
      subs: undefined,
      subsTail: undefined,
      flags: ReactiveFlags.Watching | ReactiveFlags.RecursedCheck,

      notify: (): void => {
        const flags = effectObj.flags;
        if (
          flags & ReactiveFlags.Dirty ||
          (flags & ReactiveFlags.Pending &&
            this.system.checkDirty(effectObj.deps!, effectObj))
        ) {
          run();
        } else {
          effectObj.flags = ReactiveFlags.Watching;
        }
      },

      stop: (): void => {
        effectObj.flags = ReactiveFlags.None;
        effectObj.depsTail = undefined;
        this.purgeDeps(effectObj);
      },
    };

    run();

    return effectObj;
  }
}

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
};
