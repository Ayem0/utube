import {
  Engine,
  EngineDefaultState,
  type EngineEvents,
} from "../engine/engine";
import { createEngine } from "../engine/factory";
import { Disposer, VideoSource } from "../types";
import {
  FeatureContext,
  FeatureDependencies,
  FeatureInternalState,
  FeatureRegistry,
  Features,
  FeatureState,
  type FeatureApi,
  type FeatureDependencyContext,
  type FeatureEvents,
  type FeatureInit,
  type FeatureInternalStateArgs,
  type FeatureStateArgs,
  type PlayerFeatureOptions,
  type WritableFeatureDependencyContext,
} from "./feature";
import { createStore, Store, type DeepSignal } from "./store";

export class Player<const T extends Features> {
  private _store: Store<FeatureRegistry<T>["state"]>;
  private featuresInternalState: FeatureRegistry<T>["internalState"];
  private engine: Engine;
  private videoEl: HTMLVideoElement | null = null;
  private containerEl: HTMLDivElement | null = null;
  private _apis: FeatureRegistry<T>["api"];
  private features: T;
  private featureDisposers = new Map<string, Disposer[]>();
  private featureContexts = new Map<string, FeatureContext<any, any, any>>();
  private featureOptions: PlayerFeatureOptions<T>;

  constructor(
    features: T,
    defaultState: EngineDefaultState,
    featureOptions: PlayerFeatureOptions<T> = {},
  ) {
    this.engine = createEngine(defaultState);
    this.features = features;
    this.featureOptions = featureOptions;
    this._store = createStore(this.createFeatureState(features));
    this.featuresInternalState = this.createFeatureInternalState(features);
    this._apis = this.createFeatureApi(features);
  }

  public attach(video: HTMLVideoElement, container?: HTMLDivElement) {
    this.videoEl = video;
    if (container) {
      this.containerEl = container;
    }
    this.engine.attachMedia(this.videoEl);
    this.features.forEach((feature) =>
      feature.onMediaAttach?.(this.getFeatureContext(feature)),
    );
  }

  public detach() {
    this.videoEl = null;
    this.engine.detachMedia();
    this.features.forEach((feature) =>
      feature.onMediaDetach?.(this.getFeatureContext(feature)),
    );
  }

  public loadSource(source: VideoSource) {
    this.engine.loadSource(source);
  }

  public get store(): Pick<typeof this._store, "use"> {
    return this._store;
  }

  public get apis() {
    return this._apis;
  }

  private createFeatureContext<F extends T[number]>(
    feature: F,
  ): FeatureContext<
    FeatureState<F>,
    FeatureInternalState<F>,
    FeatureDependencies<F>
  > {
    return {
      video: () => this.videoEl,
      container: () => this.containerEl,
      state: this._store.select(
        (s) => s[feature.name as F["name"]],
      ) as DeepSignal<FeatureState<F>>,
      internalState: this.featuresInternalState[
        feature.name as F["name"]
      ] as FeatureInternalState<F>,
      dependencies: this.createFeatureDependencies(feature),
      events: this.createFeatureEvents(feature),
      engine: this.engine,
      batch: this._store.batch,
      computed: this._store.computed,
      effect: this._store.effect,
    };
  }

  private createFeatureEvents<F extends T[number]>(feature: F): FeatureEvents {
    const featureName = feature.name;

    return {
      container: (type, listener, options) => {
        this.addFeatureDisposer(
          featureName,
          this.addEventListener("container", type, listener, options),
        );
      },

      video: (type, listener, options) => {
        this.addFeatureDisposer(
          featureName,
          this.addEventListener("video", type, listener, options),
        );
      },

      engine: (type, listener) => {
        this.addFeatureDisposer(
          featureName,
          this.addEventListener("engine", type, listener),
        );
      },
    };
  }

  private createFeatureDependencies<F extends T[number]>(
    feature: F,
  ): FeatureDependencyContext<FeatureDependencies<F>> {
    const dependencies = {} as WritableFeatureDependencyContext<
      FeatureDependencies<F>
    >;

    const that = this;
    const addDependency = <D extends FeatureDependencies<F>[number]>(
      dependency: D,
    ) => {
      dependencies[dependency.name as D["name"]] = {
        state: this._store.select(
          (s) => s[dependency.name as D["name"]],
        ) as DeepSignal<FeatureState<D>>,
        get api() {
          return that._apis[dependency.name as D["name"]] as FeatureApi<D>;
        },
      } as FeatureDependencyContext<FeatureDependencies<F>>[D["name"]];
    };

    for (const dependency of feature.dependencies ?? []) {
      addDependency(dependency);
    }
    return dependencies;
  }

  private addEventListener<K extends keyof EngineEvents>(
    to: "engine",
    type: K,
    listener: (...args: EngineEvents[K]) => void,
    options?: never,
  ): Disposer;

  private addEventListener<K extends keyof HTMLVideoElementEventMap>(
    to: "video",
    type: K,
    listener: (event: HTMLVideoElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): Disposer;

  private addEventListener<K extends keyof HTMLElementEventMap>(
    to: "container",
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): Disposer;

  private addEventListener(
    to: "engine" | "video" | "container",
    type: PropertyKey,
    listener: unknown,
    options?: AddEventListenerOptions,
  ): Disposer {
    switch (to) {
      case "engine": {
        const engineListener = listener as (
          ...args: EngineEvents[keyof EngineEvents]
        ) => void;

        this.engine.on(type as keyof EngineEvents, engineListener);

        return () =>
          this.engine.off(type as keyof EngineEvents, engineListener);
      }
      case "video": {
        const video = this.videoEl;

        if (!video) return () => {};

        const videoListener = listener as EventListener;

        video.addEventListener(
          type as keyof HTMLVideoElementEventMap,
          videoListener,
          options,
        );

        return () =>
          video.removeEventListener(
            type as keyof HTMLVideoElementEventMap,
            videoListener,
            options,
          );
      }

      case "container": {
        const container = this.containerEl;

        if (!container) return () => {};

        const containerListener = listener as EventListener;

        container.addEventListener(
          type as keyof HTMLElementEventMap,
          containerListener,
          options,
        );

        return () =>
          container.removeEventListener(
            type as keyof HTMLElementEventMap,
            containerListener,
            options,
          );
      }
    }
  }

  private getFeatureContext<F extends T[number]>(feature: F) {
    const cached = this.featureContexts.get(feature.name);
    if (cached) return cached;
    const ctx = this.createFeatureContext(feature);
    this.featureContexts.set(feature.name, ctx);
    return ctx;
  }

  private addFeatureDisposer(featureName: string, disposer: Disposer) {
    const disposers = this.featureDisposers.get(featureName) ?? [];
    disposers.push(disposer);
    this.featureDisposers.set(featureName, disposers);
  }

  private createFeatureApi(features: T) {
    const apis = {} as FeatureRegistry<T>["api"];

    for (const feature of features) {
      apis[feature.name as T[number]["name"]] = feature.getApi(
        this.getFeatureContext(feature),
      );
    }
    return apis;
  }

  private createFeatureInternalState(features: T) {
    const internalState = {} as FeatureRegistry<T>["internalState"];
    for (const feature of features) {
      const args = ((
        (this.featureOptions[feature.name as T[number]["name"]] ??
          {}) as FeatureInit<T[number]>
      )?.internalStateArgs ?? []) as FeatureInternalStateArgs<T[number]>;
      internalState[feature.name as T[number]["name"]] =
        feature.getInternalState(...args);
    }
    return internalState;
  }

  private createFeatureState(features: T): FeatureRegistry<T>["state"] {
    const state = {} as FeatureRegistry<T>["state"];

    for (const feature of features) {
      const args = ((
        (this.featureOptions[feature.name as T[number]["name"]] ??
          {}) as FeatureInit<T[number]>
      )?.stateArgs ?? []) as FeatureStateArgs<T[number]>;
      state[feature.name as T[number]["name"]] = feature.getState(...args);
    }

    return state;
  }
}

export function createPlayer<T extends Features>(args: {
  features: T;
  engineOptions?: EngineDefaultState;
  featureOptions?: PlayerFeatureOptions<T>;
}): Player<T> {
  return new Player<T>(
    args.features,
    { quality: args.engineOptions?.quality ?? -1 },
    args.featureOptions,
  );
}
