import {
  MediaPlayer,
  MediaPlayerClass,
  StreamInitializedEvent,
  supportsMediaSource,
} from "dashjs";
import Hls, {
  BufferAppendedData,
  ErrorData,
  FragBufferedData,
  FragLoadedData,
  FragLoadingData,
  LevelLoadedData,
  LevelSwitchedData,
  ManifestParsedData,
  MediaAttachedData,
} from "hls.js";
import { EventEmitter } from "./event-emitter";
import { VideoQuality } from "./types";

interface VideoPlayerEvents {
  qualitiesLoaded: [qualities: VideoQuality[]];
  volumeChange: [volume: number];
  timeChange: [time: number];
  playbackrateChange: [playbackRate: number];
  play: [];
  pause: [];
  ended: [];
}

export class VideoPlayer extends EventEmitter<VideoPlayerEvents> {
  private video: HTMLVideoElement | null = null;
  private hls: Hls | null = null;
  private dash: MediaPlayerClass | null = null;
  private qualities: VideoQuality[] | null = null;

  constructor() {
    super();
  }

  public attach(
    videoElement: HTMLVideoElement,
    hlsUrl: string,
    dashUrl: string,
  ) {
    console.log("attaching video player");
    this.video = videoElement;

    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
      });
      this.hls.loadSource(hlsUrl);
      this.hls.attachMedia(this.video);
      this.initVideoListeners();
      this.initHlsListeners();
    } else if (supportsMediaSource()) {
      this.dash = MediaPlayer().create();
      this.dash.updateSettings({
        // debug: {
        //   dispatchEvent: true,
        //   logLevel: LogLevel.LOG_LEVEL_DEBUG,
        // },
        streaming: {
          abr: {
            autoSwitchBitrate: {
              video: false,
            },
          },
        },
      });
      this.dash.initialize(this.video, dashUrl, true);
      this.initDashListeners();
      this.initVideoListeners();
    } else {
      console.error("Video player not supported on this device");
    }
  }

  private initDashListeners() {
    this.dash.on("streamInitialized", (data) =>
      this.onDashStreamInitialized(data),
    );
  }

  public destroy() {
    // remove video listeners
    this.video.removeEventListener("loadedmetadata", this.onLoadedMetadata);
    this.video.removeEventListener("canplay", this.onCanPlay);
    this.video.removeEventListener("playing", this.onPlaying);
    this.video.removeEventListener("waiting", this.onWaiting);
    this.video.removeEventListener("stalled", this.onStalled);
    this.video.removeEventListener("error", this.onVideoError);

    this.video.removeEventListener("volumechange", this.onVolumeChange);
    this.video.removeEventListener("timeupdate", this.onTimeUpdate);
    this.video.removeEventListener("ratechange", this.onRateChange);
    this.video.removeEventListener("play", this.onPlay);
    this.video.removeEventListener("pause", this.onPause);
    this.video.removeEventListener("ended", this.onEnded);
    // remove hls listeners
    this.hls.off(Hls.Events.ERROR, (_, data) => this.onHlsError(data));
    this.hls.off(Hls.Events.MANIFEST_PARSED, (_, data) =>
      this.onHlsManifestParsed(data),
    );
    this.hls.off(Hls.Events.LEVEL_LOADED, (_, data) =>
      this.onHlsLevelLoaded(data),
    );
    this.hls.off(Hls.Events.LEVEL_SWITCHED, (_, data) =>
      this.onHlsLevelSwitched(data),
    );
    this.hls.off(Hls.Events.MEDIA_ATTACHED, (_, data) =>
      this.onHlsMediaAttached(data),
    );
    this.hls.off(Hls.Events.FRAG_LOADING, (_, data) =>
      this.onHlsFragLoading(data),
    );
    this.hls.off(Hls.Events.FRAG_LOADED, (_, data) =>
      this.onHlsFragLoaded(data),
    );
    this.hls.off(Hls.Events.FRAG_BUFFERED, (_, data) =>
      this.onHlsFragBuffered(data),
    );
    this.hls.off(Hls.Events.BUFFER_APPENDED, (_, data) =>
      this.onHlsBufferAppended(data),
    );
    // clear this class listeners
    this.clearListeners();
    // destroy hls instance
    this.hls.destroy();
    this.hls = null;
    this.video = null;
  }

  public play() {
    return this.video.play();
  }

  public pause() {
    return this.video.pause();
  }

  public setQuality(idx: number) {
    if (this.hls) {
      if (this.hls.currentLevel === idx) return;

      this.hls.currentLevel = idx;

      // Trigger a seek to avoid Chromium browsers freezing the video until next keyframe
      // https://github.com/video-dev/hls.js/issues/3596
      const onBufferAppended = () => {
        const t = this.video.currentTime;
        this.video.currentTime = t;
        this.hls.off(Hls.Events.BUFFER_APPENDED, onBufferAppended);
      };
      this.hls.on(Hls.Events.BUFFER_APPENDED, onBufferAppended);
    } else if (this.dash) {
      if (this.dash.getCurrentRepresentationForType("video").index === idx)
        return;

      this.dash.setRepresentationForTypeByIndex("video", idx, true);

      // Trigger a seek to avoid Chromium browsers freezing the video until next keyframe
      // https://github.com/video-dev/hls.js/issues/3596
      const onQualityChangeRendered = () => {
        const t = this.video.currentTime;
        this.video.currentTime = t;
        this.dash.off("qualityChangeRendered", onQualityChangeRendered);
      };
      this.dash.on("qualityChangeRendered", onQualityChangeRendered);
    }
  }

  public setVolume(volume: number) {
    if (volume >= 0 && volume <= 1) this.video.volume = volume;
  }

  public setPlaybackRate = (playbackRate: number) => {
    if (playbackRate >= 0.25 && playbackRate <= 2)
      this.video.playbackRate = playbackRate;
  };

  public seek(ratio: number) {
    this.video.currentTime = this.video.duration * ratio;
  }

  private initVideoListeners() {
    this.video.addEventListener("loadedmetadata", this.onLoadedMetadata);
    this.video.addEventListener("canplay", this.onCanPlay);
    this.video.addEventListener("playing", this.onPlaying);
    this.video.addEventListener("waiting", this.onWaiting);
    this.video.addEventListener("stalled", this.onStalled);
    this.video.addEventListener("error", this.onVideoError);

    this.video.addEventListener("volumechange", this.onVolumeChange);
    this.video.addEventListener("timeupdate", this.onTimeUpdate);
    this.video.addEventListener("ratechange", this.onRateChange);
    this.video.addEventListener("play", this.onPlay);
    this.video.addEventListener("pause", this.onPause);
    this.video.addEventListener("ended", this.onEnded);
  }

  private initHlsListeners() {
    this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) =>
      this.onHlsManifestParsed(data),
    );
    this.hls.on(Hls.Events.LEVEL_LOADED, (_, data) =>
      this.onHlsLevelLoaded(data),
    );
    this.hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) =>
      this.onHlsLevelSwitched(data),
    );
    this.hls.on(Hls.Events.MEDIA_ATTACHED, (_, data) =>
      this.onHlsMediaAttached(data),
    );
    this.hls.on(Hls.Events.FRAG_LOADING, (_, data) =>
      this.onHlsFragLoading(data),
    );
    this.hls.on(Hls.Events.FRAG_LOADED, (_, data) =>
      this.onHlsFragLoaded(data),
    );
    this.hls.on(Hls.Events.FRAG_BUFFERED, (_, data) =>
      this.onHlsFragBuffered(data),
    );
    this.hls.on(Hls.Events.BUFFER_APPENDED, (_, data) =>
      this.onHlsBufferAppended(data),
    );
    this.hls.on(Hls.Events.ERROR, (_, data) => this.onHlsError(data));
  }

  private onHlsManifestParsed = (data: ManifestParsedData) => {
    console.log("manifest parsed", data);
    this.qualities = data.levels.map((level, i) => ({
      index: i,
      height: level.height,
      frameRate: level.frameRate,
    }));
    console.log("qualities", this.qualities);
    this.emit("qualitiesLoaded", this.qualities);
  };

  private onDashStreamInitialized = (e: StreamInitializedEvent) => {
    const reps = this.dash.getRepresentationsByType("video");
    console.log("reps", reps);
    const qualities = reps.map((rep) => ({
      index: rep.index,
      height: rep.height,
      frameRate: rep.frameRate,
    }));
    this.emit("qualitiesLoaded", qualities);
  };

  private onHlsError = (data: ErrorData) => {
    console.error("HLS Error:", data);
  };

  private onHlsLevelLoaded = (data: LevelLoadedData) => {
    console.log("Level Loaded:", data);
  };

  private onHlsLevelSwitched = (data: LevelSwitchedData) => {
    console.log("Level Switched:", data);
  };

  private onHlsMediaAttached = (data: MediaAttachedData) => {
    console.log("Media Attached:", data);
  };

  private onHlsFragLoading = (data: FragLoadingData) => {
    console.log("FRAG_LOADING", data.frag.sn, data.frag.url);
  };

  private onHlsFragLoaded = (data: FragLoadedData) => {
    console.log("FRAG_LOADED", data.frag.sn, data.frag.url);
  };

  private onHlsFragBuffered = (data: FragBufferedData) => {
    console.log("FRAG_BUFFERED", data.frag.sn, {
      startPTS: data.frag.startPTS,
      endPTS: data.frag.endPTS,
    });
  };

  private onHlsBufferAppended = (data: BufferAppendedData) => {
    console.log("BUFFER_APPENDED", data);
  };

  private onPlay = () => {
    this.emit("play");
  };

  private onPause = () => {
    this.emit("pause");
  };

  private onEnded = () => {
    this.emit("ended");
  };

  private onTimeUpdate = () => {
    this.emit("timeChange", this.video.currentTime);
  };

  private onVolumeChange = () => {
    this.emit("volumeChange", this.video.volume);
  };

  private onRateChange = () => {
    this.emit("playbackrateChange", this.video.playbackRate);
  };

  private onLoadedMetadata = () => {
    console.log("loadedmetadata", {
      duration: this.video.duration,
      readyState: this.video.readyState,
      networkState: this.video.networkState,
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
    });
  };

  private onCanPlay = () => {
    console.log("canplay", {
      readyState: this.video.readyState,
      currentTime: this.video.currentTime,
    });
  };

  private onPlaying = () => {
    console.log("playing");
  };

  private onWaiting = () => {
    console.log("waiting");
  };

  private onStalled = () => {
    console.log("stalled");
  };

  private onVideoError = () => {
    console.log("video error", this.video.error);
  };
}
