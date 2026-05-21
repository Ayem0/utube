import { Engine, EngineEvents } from "../engine/engine";
import type { DeepSignal, ReadOnlyDeepSignal } from "./store";

export type AnyFeature = Feature<string, any, any, any, readonly AnyFeature[]>;

export type FeatureDependencyContext<
  TDependencies extends readonly AnyFeature[],
> = {
  readonly [F in TDependencies[number] as F["name"]]: {
    readonly state: ReadOnlyDeepSignal<FeatureState<F>>;
    readonly api: FeatureApi<F>;
  };
};
export type WritableFeatureDependencyContext<
  TDependencies extends readonly AnyFeature[],
> = {
  [F in TDependencies[number] as F["name"]]: {
    readonly state: DeepSignal<FeatureState<F>>;
    readonly api: FeatureApi<F>;
  };
};

export type FeatureEvents = {
  video: <K extends keyof HTMLVideoElementEventMap>(
    type: K,
    listener: (event: HTMLVideoElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => void;

  container: <K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => void;

  engine: <K extends keyof EngineEvents>(
    type: K,
    listener: (...args: EngineEvents[K]) => void,
  ) => void;
};

export type FeatureContext<
  TState extends object,
  TInternalState extends object,
  TDependencies extends readonly AnyFeature[],
> = {
  video: () => HTMLVideoElement | null;

  container: () => HTMLDivElement | null;

  engine: Pick<
    Engine,
    "setQuality" | "getQualities" | "getCurrentQuality" | "getIsAuto"
  >;

  state: DeepSignal<TState>;

  internalState: TInternalState;

  events: FeatureEvents;

  dependencies: FeatureDependencyContext<TDependencies>;
  computed: <T>(getter: (previousValue?: T) => T) => () => T;
  effect: (fn: () => void | (() => void)) => () => void;
  batch: (fn: () => void) => void;
};

export type Feature<
  TName extends string,
  TState extends object,
  TInternalState extends object,
  TApi extends object,
  TDependencies extends readonly AnyFeature[],
> = {
  name: TName;
  dependencies?: TDependencies;
  getInitialState: (...args: any[]) => TState;
  getInternalInitialState: (...args: any[]) => TInternalState;
  getApi: (ctx: FeatureContext<TState, TInternalState, TDependencies>) => TApi;
  onMediaAttach?: (
    ctx: FeatureContext<TState, TInternalState, TDependencies>,
  ) => void;
  onMediaDetach?: (
    ctx: FeatureContext<TState, TInternalState, TDependencies>,
  ) => void;
  onSourceLoad?: (
    ctx: FeatureContext<TState, TInternalState, TDependencies>,
  ) => void;
};

export type FeatureState<F extends AnyFeature> = ReturnType<
  F["getInitialState"]
>;
export type FeatureApi<F extends AnyFeature> = ReturnType<F["getApi"]>;
export type FeatureInternalState<F extends AnyFeature> = ReturnType<
  F["getInternalInitialState"]
>;

export type FeatureDependencies<F extends AnyFeature> =
  F extends Feature<string, object, object, object, infer D> ? D : never;

export type Features = readonly AnyFeature[];

export type FeatureRegistry<T extends Features> = {
  state: {
    [F in T[number] as F["name"]]: FeatureState<F>;
  };
  api: {
    [F in T[number] as F["name"]]: FeatureApi<F>;
  };
  internalState: {
    [F in T[number] as F["name"]]: FeatureInternalState<F>;
  };
};

export const createFeature = <
  TName extends string,
  TState extends object,
  TInternalState extends object,
  TApi extends object,
  TDependencies extends readonly AnyFeature[],
>(
  feature: Omit<
    Feature<TName, TState, TInternalState, TApi, TDependencies>,
    "getInternalInitialState"
  > & {
    getInternalInitialState?: () => TInternalState;
  },
): Feature<TName, TState, TInternalState, TApi, TDependencies> => {
  return {
    ...feature,
    getInternalInitialState:
      feature.getInternalInitialState ?? (() => ({}) as TInternalState),
  };
};
