import { EventEmitter } from '../event-emitter';

export interface VideoPlayerController {
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  toggleFullscreen: () => void;
  startSettingVolume: () => void;
  setPreviewX: (x: number) => void;
  startScrubbing: () => void;
  stopScrubbing: () => void;
  startHoveringPlayer: () => void;
  stopHoveringPlayer: () => void;
  startHoveringPreview: () => void;
  stopHoveringPreview: () => void;
}

export enum PlayingState {
  Paused = 0,
  Playing = 1,
  Ended = 2,
}

interface VideoPlayerControllerEvents {
  volumeChange: [volume: number];
  previewTimeChange: [time: number];
  timeChange: [time: number];
  durationChange: [duration: number];
  playbackrateChange: [playbackRate: number];
  play: [];
  pause: [];
  ended: [];
}

export class VideoPlayerController2 extends EventEmitter<VideoPlayerControllerEvents> {
  /**
   *
   * @param video The video element
   * @param restoreVolume Function to restore volume state
   * @param storeVolume Function to store volume state
   */
  constructor() {
    super();
    this._id = crypto.randomUUID();
  }
  private _id;
  private _video: HTMLVideoElement | null = null;
  private _duration = Infinity;
  private _paused = true;
  private _ended = false;
  private _playRate = 1;
  private isLive = false;
  private _currentTime = 0;

  private _volume = 1;
  private muted = false;

  private wasPlaying = false;
  private lastVolume = 1;

  public get id(): Readonly<string> {
    return this._id;
  }

  public get playRate(): Readonly<number> {
    return this._playRate;
  }

  public get volume(): Readonly<number> {
    return this._volume;
  }

  public get video(): Readonly<HTMLVideoElement | null> {
    return this._video;
  }

  public get paused(): Readonly<boolean> {
    return this._paused;
  }

  public get ended(): Readonly<boolean> {
    return this._ended;
  }

  private storeVolume: ((volume: number, muted: boolean) => void) | undefined;
  private restoreVolume: (() => { volume: number; muted: boolean }) | undefined;
  private storePlaybackrate: ((playbackRate: number) => void) | undefined;
  private restorePlaybackrate: (() => { playbackRate: number }) | undefined;

  public init = (
    video: HTMLVideoElement,
    restoreVolume:
      | (() => { volume: number; muted: boolean })
      | undefined = undefined,
    storeVolume:
      | ((volume: number, muted: boolean) => void)
      | undefined = undefined,
    restorePlaybackrate:
      | (() => { playbackRate: number })
      | undefined = undefined,
    storePlaybackrate: ((playbackRate: number) => void) | undefined = undefined,
  ) => {
    this._video = video;
    this.restoreVolume = restoreVolume;
    this.storeVolume = storeVolume;
    this.restorePlaybackrate = restorePlaybackrate;
    this.storePlaybackrate = storePlaybackrate;

    if (this.restorePlaybackrate) {
      try {
        const restored = this.restorePlaybackrate();
        this._playRate = restored.playbackRate;
        this._video.playbackRate = this._playRate;
      } catch (error) {
        console.error('Error restoring playback rate.', error);
      }
    }

    if (this.restoreVolume) {
      try {
        const restored = this.restoreVolume();
        this.lastVolume = restored.volume;
        this._volume = restored.volume;
        this._video.volume = this._volume;
        this.muted = restored.muted;
        this._video.muted = this.muted;
      } catch (error) {
        console.error('Error restoring volume.', error);
      }
    }

    this.initListeners();
  };

  public destroy = () => {
    this._video?.removeEventListener('play', this.onPlay);
    this._video?.removeEventListener('pause', this.onPause);
    this._video?.removeEventListener('ended', this.onEnded);
    this._video?.removeEventListener('volumechange', this.onVolumeChange);
    this._video?.removeEventListener('timeupdate', this.onTimeUpdate);
    this._video?.removeEventListener('loadedmetadata', this.onLoadedMetadata);
  };

  // private playingState = PlayingState.Paused;

  private initListeners = () => {
    this._video?.addEventListener('play', this.onPlay);
    this._video?.addEventListener('ratechange', this.onRateChange);
    this._video?.addEventListener('pause', this.onPause);
    this._video?.addEventListener('ended', this.onEnded);
    this._video?.addEventListener('volumechange', this.onVolumeChange);
    this._video?.addEventListener('timeupdate', this.onTimeUpdate);
    this._video?.addEventListener('loadedmetadata', this.onLoadedMetadata);
    this._video?.addEventListener('ratechange', this.onRateChange);
  };

  private onRateChange = () => {
    if (!this._video) return;
    this._playRate = this._video.playbackRate;
    this.emit('playbackrateChange', this._playRate);
    this.storePlaybackrate?.(this._playRate);
  };

  public togglePlay = () => {
    if (!this._video) return;
    if (this._paused) {
      this._video.play();
    } else {
      this._video.pause();
    }
  };
  /** Toggle mute/unmute */
  public toggleMute = () => {
    if (!this._video) return;
    this._video.muted = !this._video.muted;
  };

  /** Set volume */
  public setVolume = (volume: number) => {
    if (!this._video) return;
    if (volume < 0 || volume > 1) return;
    if (volume === 0) {
      this._video.volume = this.lastVolume;
      this._video.muted = true;
    } else {
      this._video.volume = volume;
      this._video.muted = false;
    }
  };

  public incrementVolume = (by: number) => {
    if (!this._video || by < 0) return;
    if (this._video.volume + by > 1) {
      this._video.volume = 1;
    } else {
      this._video.volume += by;
    }
    if (this._video.muted) {
      this._video.muted = false;
    }
  };

  public decrementVolume = (by: number) => {
    if (!this._video || by < 0) return;
    if (this._video.volume - by < 0) {
      this._video.volume = 0;
    } else {
      this._video.volume -= by;
    }
    if (this._video.volume === 0) {
      this._video.muted = true;
    }
  };

  /** Store last volume before setting volume */
  public startSettingVolume = () => {
    if (!this._video) return;
    this.lastVolume = this._video.volume;
  };

  /** Toggle fullscreen */

  /** Start scrubbing */
  public startScrubbing = () => {
    if (!this._video) return;
    this.wasPlaying = !this._paused;
    if (this._ended) {
      this._ended = false;
      this.emit('pause');
    }
    if (this.wasPlaying) {
      this._video.pause();
    }
  };

  public setPlaybackRate = (playbackRate: number) => {
    if (!this._video) return;
    this._video.playbackRate = playbackRate;
  };

  private seek = (ratio: number) => {
    if (!this._video) return;
    this._video.currentTime = ratio * this._video.duration;
    if (this._video.currentTime === this._video.duration) {
      this._ended = true;
      this.emit('ended');
    }
  };

  /** Stop scrubbing */
  public stopScrubbing = (ratio: number) => {
    if (!this._video) return;
    this.seek(ratio);

    if (this.wasPlaying) {
      this._video.play();
    }
  };

  // #endregion

  // #region Events handlers
  /** Handle fullscreen change */

  /** Handle loaded metadata */
  private onLoadedMetadata = () => {
    if (!this._video) return;
    // this.invDuration = 1 / this.video.duration;
    this.emit('timeChange', this._video.currentTime);
    this.emit('durationChange', this._video.duration);
    this.emit('volumeChange', this._video.muted ? 0 : this._video.volume);
    this.emit('playbackrateChange', this._video.playbackRate);
  };
  /** Handle ended */
  private onEnded = () => {
    if (!this._video) return;
    this._ended = true;
    this.emit('ended');
  };
  /** Handle pause */
  private onPause = () => {
    if (!this._video) return;
    this._paused = true;
    this.emit('pause');
  };
  /** Handle play */
  private onPlay = () => {
    if (!this._video) return;
    this._paused = false;
    this._ended = false;
    this.emit('play');
  };
  /** Handle volume change */
  private onVolumeChange = () => {
    if (!this._video) return;
    this._volume = this._video.muted ? 0 : this._video.volume;
    // this.muted = this.video.muted;
    this.emit('volumeChange', this._volume);
    this.storeVolume?.(
      this._video.muted ? this.lastVolume : this._video.volume,
      this._video.muted,
    );
  };
  /** Handle time update */
  private onTimeUpdate = () => {
    if (!this._video) return;
    this.emit('timeChange', this._video.currentTime);
  };
  // #endregion
}
