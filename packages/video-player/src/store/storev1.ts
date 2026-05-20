import { Engine } from "../engine/engine";
import { createEngine } from "../engine/factory";
import { VideoQuality, VideoSource } from "../types";

interface VideoPlayerState {
  muted: boolean;
  volume: number;
  playbackRate: number;
  time: number;
  duration: number;
  qualities: VideoQuality[];
  currentQuality: number;
  fullscreen: boolean;
  playingState: "idle" | "playing" | "paused" | "waiting" | "ended" | "error";
}

export class VideoPlayerStore {
  private engine: Engine;
  private videoEl: HTMLVideoElement | null = null;
  private state: VideoPlayerState = {
    muted: false,
    volume: 1,
    playbackRate: 1,
    time: 0,
    duration: 0,
    qualities: [],
    currentQuality: -1,
    fullscreen: false,
    playingState: "idle",
  };
  constructor(defaultState: {
    muted?: boolean;
    volume?: number;
    quality?: number;
    playbackRate?: number;
  }) {
    this.state = {
      ...this.state,
      muted: defaultState.muted ?? this.state.muted,
      volume: defaultState.volume ?? this.state.volume,
      currentQuality: defaultState.quality ?? this.state.currentQuality,
      playbackRate: defaultState.playbackRate ?? this.state.playbackRate,
    };
    this.engine = createEngine({
      quality: this.state.currentQuality,
    });
    this.initEngineListeners();
  }

  //#region Public apis

  public attach = (videoEl: HTMLVideoElement) => {
    if (this.videoEl) {
      this.destroyVideoListeners();
      this.engine.detachMedia();
      this.videoEl = null;
    }
    this.videoEl = videoEl;
    this.setVideoElState();
    this.initVideoListeners();
    this.engine.attachMedia(this.videoEl);
  };

  public loadSource = (source: VideoSource) => {
    this.engine.loadSource(source);
  };

  public setQuality = (qualityIndex: number) => {
    this.engine.setQuality(qualityIndex);
  };

  public play = () => {
    this.videoEl?.play();
  };

  public pause = () => {
    this.videoEl?.pause();
  };

  public seekTo = (time: number) => {
    if (!this.videoEl) return;
    this.videoEl.currentTime = time;
  };

  public setVolume = (volume: number) => {
    if (!this.videoEl) return;
    this.videoEl.volume = volume;
  };

  public setMuted = (muted: boolean) => {
    if (!this.videoEl) return;
    this.videoEl.muted = muted;
  };

  public setPlaybackRate = (playbackRate: number) => {
    if (!this.videoEl) return;
    this.videoEl.playbackRate = playbackRate;
  };

  public destroy = () => {
    this.destroyVideoListeners();
    this.destroyEngineListeners();
    this.engine.destroy();
    this.videoEl = null;
  };

  //#endregion

  //#region Private methods

  private setState = (newState: Partial<VideoPlayerState>) => {
    this.state = { ...this.state, ...newState };
  };

  private setVideoElState = () => {
    if (!this.videoEl) return;
    this.videoEl.volume = this.state.volume;
    this.videoEl.muted = this.state.muted;
    this.videoEl.playbackRate = this.state.playbackRate;
  };

  //#region Video element listeners

  private initVideoListeners = () => {
    if (!this.videoEl) return;
    this.videoEl.addEventListener("volumechange", this.onVolumeChange);
    this.videoEl.addEventListener("play", this.onPlay);
    this.videoEl.addEventListener("pause", this.onPause);
    this.videoEl.addEventListener("timeupdate", this.onTimeUpdate);
    this.videoEl.addEventListener("durationchange", this.onDurationChange);
    this.videoEl.addEventListener(
      "playbackratechange",
      this.onPlaybackRateChange,
    );
    this.videoEl.addEventListener("error", this.onError);
    this.videoEl.addEventListener("waiting", this.onWaiting);
    this.videoEl.addEventListener("playing", this.onPlaying);
    this.videoEl.addEventListener("ended", this.onEnded);
  };

  private destroyVideoListeners = () => {
    if (!this.videoEl) return;
    this.videoEl.removeEventListener("volumechange", this.onVolumeChange);
    this.videoEl.removeEventListener("play", this.onPlay);
    this.videoEl.removeEventListener("pause", this.onPause);
    this.videoEl.removeEventListener("timeupdate", this.onTimeUpdate);
    this.videoEl.removeEventListener("durationchange", this.onDurationChange);
    this.videoEl.removeEventListener(
      "playbackratechange",
      this.onPlaybackRateChange,
    );
    this.videoEl.removeEventListener("error", this.onError);
    this.videoEl.removeEventListener("waiting", this.onWaiting);
    this.videoEl.removeEventListener("playing", this.onPlaying);
    this.videoEl.removeEventListener("ended", this.onEnded);
  };

  private onVolumeChange = () => {
    if (!this.videoEl) return;
    this.setState({
      volume: this.videoEl.volume,
      muted: this.videoEl.muted,
    });
  };

  private onPlay = () => {
    this.setState({ playingState: "playing" });
  };

  private onPause = () => {
    this.setState({ playingState: "paused" });
  };

  private onTimeUpdate = () => {
    if (!this.videoEl) return;
    this.setState({ time: this.videoEl.currentTime });
  };

  private onDurationChange = () => {
    if (!this.videoEl) return;
    this.setState({ duration: this.videoEl.duration });
  };

  private onPlaybackRateChange = () => {
    if (!this.videoEl) return;
    this.setState({
      playbackRate: this.videoEl.playbackRate,
    });
  };

  private onError = () => {
    this.setState({ playingState: "error" });
  };

  private onWaiting = () => {
    this.setState({ playingState: "waiting" });
  };

  private onPlaying = () => {
    this.setState({ playingState: "playing" });
  };

  private onEnded = () => {
    this.setState({ playingState: "ended" });
  };

  //#endregion

  //#region Engine
  private initEngineListeners = () => {
    this.engine.on("qualitiesChanged", this.onQualitiesChanged);
    this.engine.on("qualityChanged", this.onQualityChanged);
  };

  private destroyEngineListeners = () => {
    this.engine.off("qualitiesChanged", this.onQualitiesChanged);
    this.engine.off("qualityChanged", this.onQualityChanged);
  };

  private onQualitiesChanged = (qualities: VideoQuality[]) => {
    this.setState({ qualities });
  };

  private onQualityChanged = (qualityIndex: number) => {
    this.setState({ currentQuality: qualityIndex });
  };
  //#endregion

  //#endregion
}
