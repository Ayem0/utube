import {
  FeatureContext,
  FeatureDependencies,
  FeatureInternalState,
  FeatureRegistry,
  Features,
  FeatureState,
} from "../feature/feature";
import { Disposer } from "../types";

export type StoreState<T extends Features> = FeatureRegistry<T>["state"];
export type StoreApi<T extends Features> = FeatureRegistry<T>["api"];
export type StoreInternalState<T extends Features> =
  FeatureRegistry<T>["internalState"];

type Listener = () => void;

export class Store<T extends Features> {
  private _state: StoreState<T>;
  private _internalState: StoreInternalState<T>;
  private _api: StoreApi<T>;
  private featureListeners = new Map<keyof StoreState<T>, Set<Listener>>();
  // private listeners = new Set<Listener>();

  constructor(
    features: T,
    createFeatureContext: <F extends T[number]>(
      feature: F,
    ) => FeatureContext<
      FeatureState<F>,
      FeatureInternalState<F>,
      FeatureDependencies<F>
    >,
  ) {
    this._state = Object.assign(
      {},
      ...features.map((feature) => ({
        [feature.name]: feature.getInitialState(),
      })),
    );
    this._api = Object.assign(
      {},
      ...features.map((feature) => ({
        [feature.name]: feature.getApi(createFeatureContext(feature)),
      })),
    );
    this._internalState = Object.assign(
      {},
      ...features.map((feature) => ({
        [feature.name]: feature.getInternalInitialState(),
      })),
    );
  }

  public subscribeFeature = <K extends keyof StoreState<T>>(
    featureName: K,
    listener: Listener,
  ): Disposer => {
    if (!this.featureListeners.has(featureName)) {
      this.featureListeners.set(featureName, new Set());
    }
    this.featureListeners.get(featureName)!.add(listener);
    return () => {
      this.featureListeners.get(featureName)?.delete(listener);
    };
  };

  // public getSnapshot = <R extends unknown>(
  //   selector: (state: StoreState<T>) => R,
  // ) => selector(this._state);

  public getFeatureSnapshot<K extends keyof StoreState<T>>(
    featureName: K,
  ): StoreState<T>[K];

  public getFeatureSnapshot<K extends keyof StoreState<T>, SS>(
    featureName: K,
    selector: (state: StoreState<T>[K]) => SS,
  ): SS;

  public getFeatureSnapshot<K extends keyof StoreState<T>, SS>(
    featureName: K,
    selector?: (state: StoreState<T>[K]) => SS,
  ): StoreState<T>[K] | SS {
    return selector
      ? selector(this._state[featureName])
      : this._state[featureName];
  }

  // public subscribe = (listener: Listener): Disposer => {
  //   this.listeners.add(listener);

  //   return () => {
  //     this.listeners.delete(listener);
  //   };
  // };

  private notify = (featureName: keyof StoreState<T>) => {
    this.featureListeners.get(featureName)?.forEach((listener) => listener());
    // this.listeners.forEach((listener) => listener());
  };

  public setInternalState = <K extends keyof StoreInternalState<T>>(
    featureName: K,
    newState: Partial<StoreInternalState<T>[K]>,
  ) => {
    this._internalState = {
      ...this._internalState,
      [featureName]: {
        ...this._internalState[featureName],
        ...newState,
      },
    };
  };

  public getState = <F extends keyof StoreState<T>>(featureName: F) => {
    return this._state[featureName];
  };

  public getApi = <F extends keyof StoreApi<T>>(featureName: F) => {
    return this._api[featureName];
  };

  public setState = <K extends keyof StoreState<T>>(
    featureName: K,
    newState: Partial<StoreState<T>[K]>,
  ) => {
    if (!this.hasPatchChanged(this._state[featureName], newState)) return;

    this._state[featureName] = {
      ...this._state[featureName],
      ...newState,
    };
    this.notify(featureName);
  };

  private hasPatchChanged<S extends object>(
    prev: S,
    patch: Partial<S>,
  ): boolean {
    for (const key of Reflect.ownKeys(patch) as Array<keyof S>) {
      if (!Object.is(prev[key], patch[key])) {
        return true;
      }
    }

    return false;
  }

  public getInternalState = <F extends keyof StoreInternalState<T>>(
    featureName: F,
  ) => {
    return this._internalState[featureName];
  };
}
