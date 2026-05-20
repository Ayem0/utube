import { Engine, EngineDefaultState } from "../engine/engine";
import { createEngine } from "../engine/factory";
import {
  FeatureContext,
  FeatureDependencies,
  FeatureInternalState,
  Features,
  FeatureState,
} from "../feature/feature";
import { Store } from "../store/store";
import { Disposer, VideoSource } from "../types";

export class Player<T extends Features> {
  private _store: Store<T>;
  private engine: Engine;
  private videoEl: HTMLVideoElement | null = null;
  private containerEl: HTMLDivElement | null = null;
  private features: T;
  private featureDisposers = new Map<T[number]["name"], Disposer[]>();

  constructor(features: T, defaultState: EngineDefaultState) {
    this.features = features;
    this._store = new Store<T>(this.features, this.createFeatureContext);
    this.engine = createEngine(defaultState);
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

  private createFeatureContext = <F extends T[number]>(
    feature: F,
  ): FeatureContext<
    FeatureState<F>,
    FeatureInternalState<F>,
    FeatureDependencies<F>
  > => {
    return {
      getVideo: () => this.videoEl,
      getContainer: () => this.containerEl,
      setState: (newState) => this.store.setState(feature.name, newState),
      getState: () => this.store.getState(feature.name),
      setInternalState: (newState) =>
        this.store.setInternalState(feature.name, newState),
      getInternalState: () => this.store.getInternalState(feature.name),
      getDependencyState: (featureName) => this.store.getState(featureName),
      getDependencyApi: (featureName) => this.store.getApi(featureName),
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

  private addFeatureDisposer = (
    featureName: T[number]["name"],
    listener: Disposer,
  ) => {
    const disposers = this.featureDisposers.get(featureName) ?? [];
    disposers.push(listener);
    this.featureDisposers.set(featureName, disposers);
  };
}
