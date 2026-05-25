import { Engine, EngineEvents } from "../engine/engine";
import type { DeepSignal, ReadOnlyDeepSignal } from "../store/store";

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
  getVideo: () => HTMLVideoElement | null;

  getContainer: () => HTMLDivElement | null;

  engine: Pick<
    Engine,
    | "setQuality"
    | "getQualities"
    | "getCurrentQuality"
    | "getIsAuto"
    | "preloadStream"
  >;

  state: DeepSignal<TState>;

  internalState: TInternalState;

  events: FeatureEvents;

  dependencies: FeatureDependencyContext<TDependencies>;
  computed: <T>(getter: (previousValue?: T) => T) => () => T;
  effect: (fn: () => void | (() => void)) => () => void;
  batch: (fn: () => void) => void;
};

type StateGetter = (...args: any[]) => object;

export type Feature<
  TName extends string,
  // TState extends object,
  // TInternalState extends object,
  TGetState extends StateGetter,
  TGetInternalState extends StateGetter,
  TApi extends object,
  TDependencies extends readonly AnyFeature[],
> = {
  name: TName;
  dependencies?: TDependencies;
  getState: TGetState;
  getInternalState: TGetInternalState;
  getApi: (
    ctx: FeatureContext<
      ReturnType<TGetState>,
      ReturnType<TGetInternalState>,
      TDependencies
    >,
  ) => TApi;
  onSetup?: (
    ctx: FeatureContext<
      ReturnType<TGetState>,
      ReturnType<TGetInternalState>,
      TDependencies
    >,
  ) => void;
  onDestroy?: (
    ctx: FeatureContext<
      ReturnType<TGetState>,
      ReturnType<TGetInternalState>,
      TDependencies
    >,
  ) => void;
  onMediaAttach?: (
    ctx: FeatureContext<
      ReturnType<TGetState>,
      ReturnType<TGetInternalState>,
      TDependencies
    >,
  ) => void;
  onMediaDetach?: (
    ctx: FeatureContext<
      ReturnType<TGetState>,
      ReturnType<TGetInternalState>,
      TDependencies
    >,
  ) => void;
  onSourceLoad?: (
    ctx: FeatureContext<
      ReturnType<TGetState>,
      ReturnType<TGetInternalState>,
      TDependencies
    >,
  ) => void;
};

export type FeatureState<F extends AnyFeature> = ReturnType<F["getState"]>;

export type FeatureStateArgs<F extends AnyFeature> = Parameters<F["getState"]>;

export type FeatureInternalStateArgs<F extends AnyFeature> = Parameters<
  F["getInternalState"]
>;
export type FeatureApi<F extends AnyFeature> = ReturnType<F["getApi"]>;
export type FeatureInternalState<F extends AnyFeature> = ReturnType<
  F["getInternalState"]
>;

export type FeatureDependencies<F extends AnyFeature> =
  F extends Feature<string, any, any, any, infer D> ? D : never;

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

export type FeatureInit<F extends AnyFeature> = {
  stateArgs?: FeatureStateArgs<F>;
  internalStateArgs?: FeatureInternalStateArgs<F>;
};

export type PlayerFeatureOptions<T extends Features> = {
  [F in T[number] as F["name"]]?: FeatureInit<F>;
};

export const createFeature = <
  TName extends string,
  // TState extends object,
  // TInternalState extends object,
  TGetState extends StateGetter,
  TGetInternalState extends StateGetter,
  TApi extends object,
  TDependencies extends readonly AnyFeature[],
>(
  feature: Omit<
    Feature<TName, TGetState, TGetInternalState, TApi, TDependencies>,
    "getInternalState"
  > & {
    getInternalState?: TGetInternalState;
  },
): Feature<TName, TGetState, TGetInternalState, TApi, TDependencies> => {
  return {
    ...feature,
    getInternalState:
      feature.getInternalState ?? ((() => ({})) as TGetInternalState),
  };
};
