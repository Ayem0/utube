import { Engine, EngineEvents } from "../engine/engine";
import { Disposer } from "../types";

export type AnyFeature = Feature<string, any, any, any, readonly AnyFeature[]>;

export type FeatureContext<
  TState extends object,
  TPrivateState extends object,
  TDependencies extends readonly AnyFeature[],
> = {
  getVideo: () => HTMLVideoElement | null;

  getContainer: () => HTMLDivElement | null;

  setState: (newState: Partial<TState>) => void;

  getState: () => TState;

  getDependencyState: <K extends TDependencies[number]["name"]>(
    featureName: K,
  ) => ReturnType<
    Extract<TDependencies[number], { name: K }>["getInitialState"]
  >;

  setInternalState: (newState: Partial<TPrivateState>) => void;

  getInternalState: () => TPrivateState;

  getDependencyApi: <K extends TDependencies[number]["name"]>(
    featureName: K,
  ) => ReturnType<Extract<TDependencies[number], { name: K }>["getApi"]>;

  addMediaEventListener: <K extends keyof HTMLVideoElementEventMap>(
    type: K,
    listener: (event: HTMLVideoElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => Disposer;

  addContainerEventListener: <K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => Disposer;

  addEngineEventListener: <K extends keyof EngineEvents>(
    type: K,
    listener: (...args: EngineEvents[K]) => void,
  ) => Disposer;

  getEngineApi: () => Pick<
    Engine,
    "setQuality" | "getQualities" | "getCurrentQuality" | "getIsAuto"
  >;
};

export type Feature<
  TName extends string,
  TState extends object,
  TPrivateState extends object,
  TApi extends object,
  TDependencies extends readonly AnyFeature[],
> = {
  name: TName;
  dependencies?: TDependencies;
  getInitialState: (...args: any[]) => TState;
  getInternalInitialState: (...args: any[]) => TPrivateState;
  getApi: (ctx: FeatureContext<TState, TPrivateState, TDependencies>) => TApi;
  onMediaAttach?: (
    ctx: FeatureContext<TState, TPrivateState, TDependencies>,
  ) => void;
  onMediaDetach?: (
    ctx: FeatureContext<TState, TPrivateState, TDependencies>,
  ) => void;
  onSourceLoad?: (
    ctx: FeatureContext<TState, TPrivateState, TDependencies>,
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
    [K in T[number]["name"]]: FeatureState<AnyFeature>;
  };
  api: {
    [K in T[number]["name"]]: FeatureApi<AnyFeature>;
  };
  internalState: {
    [K in T[number]["name"]]: FeatureInternalState<AnyFeature>;
  };
};
