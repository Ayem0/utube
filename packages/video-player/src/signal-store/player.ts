import { Engine, EngineDefaultState } from "../engine/engine";
import { createEngine } from "../engine/factory";
import { Disposer, VideoSource } from "../types";
import {
  AnyFeature,
  FeatureContext,
  FeatureDependencies,
  FeatureInternalState,
  FeatureRegistry,
  Features,
  FeatureState,
} from "./feature";
import { createStore, Store } from "./store";

export class Player<const T extends Features> {
  private _store: Store<FeatureRegistry<T>["state"]>;
  private engine: Engine;
  private videoEl: HTMLVideoElement | null = null;
  private containerEl: HTMLDivElement | null = null;
  private apis: FeatureRegistry<T>["api"];
  private features: T;
  private featureDisposers = new Map<string, Disposer[]>();

  constructor(features: T, defaultState: EngineDefaultState) {
    this.engine = createEngine(defaultState);
    this.features = features;
    this._store = createStore(this.createFeatureInitialState(features));
    this.apis = this.createFeatureApi(features);
  }

  public attach = (video: HTMLVideoElement, container?: HTMLDivElement) => {
    this.videoEl = video;
    if (container) {
      this.containerEl = container;
    }
    this.engine.attachMedia(this.videoEl);
    this.features.forEach((feature) =>
      feature.onMediaAttach?.(this.createFeatureContext(feature)),
    );
  };

  public detach = () => {
    this.videoEl = null;
    this.engine.detachMedia();
    this.features.forEach((feature) =>
      feature.onMediaDetach?.(this.createFeatureContext(feature)),
    );
  };

  public loadSource = (source: VideoSource) => {
    this.engine.loadSource(source);
  };

  public get store() {
    return this._store;
  }

  private createFeatureContext = <F extends AnyFeature>(
    feature: F,
  ): FeatureContext<
    FeatureState<F>,
    FeatureInternalState<F>,
    FeatureDependencies<F>
  > => {
    return {
      getVideo: () => this.videoEl,
      getContainer: () => this.containerEl,
      state: () => this.store.value[feature.name as F["name"]],
      setState: (newState) => {
        const test = this.store.value[feature.name as F["name"]];
      },
      getState: () => this.store.get((s) => s[feature.name as F["name"]]),

      setInternalState: (newState) =>
        this.store.setInternalState(feature.name, newState),
      getInternalState: () => this.store.get((s) => s),
      getDependencyState: (featureName, selector) =>
        this.store.get((s) => selector(s[featureName])),

      getDependencyApi: (featureName) => this.apis[featureName],
      addMediaEventListener: (type, listener, options) => {
        const video = this.videoEl;
        if (!video) return () => {};
        video.addEventListener(type, listener, options);
        const dispose = () => {
          video.removeEventListener(type, listener, options);
        };
        this.addFeatureDisposer(feature.name, dispose);
        return dispose;
      },
      addContainerEventListener: (type, listener, options) => {
        const container = this.containerEl;
        if (!container) return () => {};
        container.addEventListener(type, listener, options);
        const dispose = () => {
          container.removeEventListener(type, listener, options);
        };
        this.addFeatureDisposer(feature.name, dispose);
        return dispose;
      },
      addEngineEventListener: (type, listener) => {
        this.engine.on(type, listener);
        const dispose = () => {
          this.engine.off(type, listener);
        };
        this.addFeatureDisposer(feature.name, dispose);
        return dispose;
      },
      getEngineApi: () => this.engine,
    };
  };

  private addFeatureDisposer = (featureName: string, listener: Disposer) => {
    const disposers = this.featureDisposers.get(featureName) ?? [];
    disposers.push(listener);
    this.featureDisposers.set(featureName, disposers);
  };

  private createFeatureApi(features: T) {
    const apis = {} as FeatureRegistry<T>["api"];

    for (const feature of features) {
      apis[feature.name as T[number]["name"]] = feature.getApi(
        this.createFeatureContext(feature),
      );
    }
    return apis;
  }

  private createFeatureInitialState(features: T): FeatureRegistry<T>["state"] {
    const state = {} as FeatureRegistry<T>["state"];

    for (const feature of features) {
      state[feature.name as T[number]["name"]] = feature.getInitialState();
    }

    return state;
  }
}
