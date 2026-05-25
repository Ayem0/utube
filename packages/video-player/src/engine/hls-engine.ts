import Hls, {
  Events,
  LevelsUpdatedData,
  LevelSwitchedData,
  LevelUpdatedData,
  ManifestParsedData,
  type BufferAppendedData,
  type BufferFlushedData,
} from "hls.js";
import { VideoQuality, VideoSource } from "../types";
import { Engine, EngineOptions } from "./engine";

export class HlsEngine extends Engine {
  private hls: Hls;
  private qualities: VideoQuality[] = [];
  private videoEl: HTMLVideoElement | null = null;

  constructor(defaultState: EngineOptions) {
    super(defaultState);
    this.hls = new Hls({
      enableWorker: true,
      startLevel: defaultState.quality,
      maxBufferLength: 60,
      maxMaxBufferLength: 120,
      maxBufferSize: 120 * 1000 * 1000,

      capLevelToPlayerSize: true,
      capLevelOnFPSDrop: true,
    });
    this.initListeners();
  }

  /** Load the source and attach to video element */
  public loadSource = (source: VideoSource) => {
    this.resetState();
    if (source.hls) this.hls.loadSource(source.hls);
  };

  public attachMedia = (video: HTMLVideoElement) => {
    if (this.videoEl) this.detachMedia();
    this.videoEl = video;
    this.hls.attachMedia(this.videoEl);
  };

  public detachMedia = () => {
    this.hls.detachMedia();
    this.videoEl = null;
  };

  public preloadStream = (time: number) => {
    this.hls.startLoad(time, true);
  };

  /** Set quality to specific quality index */
  public setQuality = (qualityIndex: number) => {
    if (qualityIndex < -1 || qualityIndex >= this.hls.levels.length) return;
    if (this.hls.currentLevel === qualityIndex) return;

    this.hls.currentLevel = qualityIndex;
    // Trigger a seek to avoid Chromium browsers freezing the video until next keyframe
    // https://github.com/video-dev/hls.js/issues/3596
    this.hls.once(Hls.Events.BUFFER_APPENDED, () => {
      if (this.videoEl) {
        const t = this.videoEl.currentTime;
        this.videoEl.currentTime = t;
      }
    });
  };

  /** Get current quality index */
  public getCurrentQuality = (): VideoQuality | null => {
    const level = this.hls.levels[this.hls.currentLevel];
    if (!level) return null;
    return {
      index: this.hls.currentLevel,
      height: level.height,
      frameRate: level.frameRate,
    };
  };

  /** Get auto selection */
  public getIsAuto = () => {
    return this.hls.autoLevelEnabled;
  };

  /**
   * Get available video qualities
   * @returns loaded qualities or empty array
   */
  public getQualities = () => {
    return this.qualities;
  };

  /** Destroy engine instance */
  public destroy = () => {
    this.destroyHls();
    this.clearListeners();
  };

  /** Destroy hls instance */
  private destroyHls = () => {
    this.destroyListeners();
    this.hls.destroy();
    this.resetState();
  };

  /** Reset engine internal state */
  private resetState = () => {
    this.qualities = [];
    this.emit("qualitiesChanged", []);
  };

  private initListeners = () => {
    this.hls.on(Events.MANIFEST_PARSED, this.onManifestParsed);
    this.hls.on(Events.LEVEL_UPDATED, this.onLevelUpdated);
    this.hls.on(Events.LEVEL_SWITCHED, this.onLevelSwitched);
    this.hls.on(Events.LEVELS_UPDATED, this.onLevelsUpdated);
    this.hls.on(Events.BUFFER_APPENDED, this.onBufferAppended);
    this.hls.on(Events.BUFFER_FLUSHED, this.onBufferFlushed);
  };

  private destroyListeners = () => {
    this.hls.off(Events.MANIFEST_PARSED, this.onManifestParsed);
    this.hls.off(Events.LEVEL_UPDATED, this.onLevelUpdated);
    this.hls.off(Events.LEVEL_SWITCHED, this.onLevelSwitched);
    this.hls.off(Events.LEVELS_UPDATED, this.onLevelsUpdated);
    this.hls.off(Events.BUFFER_APPENDED, this.onBufferAppended);
    this.hls.off(Events.BUFFER_FLUSHED, this.onBufferFlushed);
  };

  private onBufferFlushed = (
    event: Events.BUFFER_FLUSHED,
    data: BufferFlushedData,
  ) => {
    console.log("HLS BUFFER_FLUSHED");
    if (this.videoEl) {
      this.emit("bufferedEnd", getMaxBufferedEnd(this.videoEl));
    }
  };

  private onBufferAppended = (
    event: Events.BUFFER_APPENDED,
    data: BufferAppendedData,
  ) => {
    console.log("HLS BUFFER_APPENDED");
    if (this.videoEl) {
      this.emit("bufferedEnd", getMaxBufferedEnd(this.videoEl));
    }
  };

  private onLevelsUpdated = (
    event: Events.LEVELS_UPDATED,
    data: LevelsUpdatedData,
  ) => {
    console.log("HLS LEVELS_UPDATED", data.levels);
    this.qualities = data.levels.map((level, i) => ({
      index: i,
      height: level.height,
      frameRate: level.frameRate,
    }));
    this.emit("qualitiesChanged", this.qualities);
  };

  private onManifestParsed = (
    _: Events.MANIFEST_PARSED,
    data: ManifestParsedData,
  ) => {
    console.log("HLS MANIFEST_PARSED", data);
    this.qualities = data.levels.map((level, i) => ({
      index: i,
      height: level.height,
      frameRate: level.frameRate,
    }));
    this.emit("qualitiesChanged", this.qualities);
  };

  private onLevelUpdated = (
    _: Events.LEVEL_UPDATED,
    data: LevelUpdatedData,
  ) => {
    console.log("HLS LEVEL_UPDATED", data);
  };

  private onLevelSwitched = (
    _: Events.LEVEL_SWITCHED,
    data: LevelSwitchedData,
  ) => {
    const quality = this.getCurrentQuality();
    if (quality) {
      this.emit("qualityChanged", quality);
    }
  };
}

function getMaxBufferedEnd(video: HTMLVideoElement) {
  let maxEnd = 0;
  for (let i = 0; i < video.buffered.length; i++) {
    maxEnd = Math.max(maxEnd, video.buffered.end(i));
  }
  return maxEnd;
}
