import { EventEmitter } from "../event-emitter";
import { VideoQuality, VideoSource } from "../types";

export abstract class Engine extends EventEmitter<EngineEvents> {
  constructor(defaultState: EngineOptions) {
    super();
  }
  public abstract loadSource: (source: VideoSource) => void;
  public abstract attachMedia: (video: HTMLVideoElement) => void;
  public abstract detachMedia: () => void;

  public abstract destroy: () => void;

  public abstract setQuality: (qualityIndex: number) => void;
  public abstract getQualities: () => readonly VideoQuality[];
  public abstract getCurrentQuality: () => VideoQuality | null;
  public abstract getIsAuto: () => boolean;
  public abstract preloadStream: (time: number) => void;
}

export interface EngineEvents {
  qualitiesChanged: [qualities: readonly VideoQuality[]];
  qualityChanged: [quality: VideoQuality];
  bufferedEnd: [end: number];
}

export interface EngineOptions {
  quality: number;
}
