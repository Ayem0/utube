import {
  getSessionVolumeState,
  setSessionVolumeState,
} from '../video-player-volume';
import { VideoPlayerControllerState } from './video-player-state';
import { formatCt } from './video-player-utils';

/**
 * TODOs :
 * - never use react + notify, use direct node update (timer, volume ...)                X
 * - use css animation instead of raf loop while playing for slider progress             X
 * - only use raf loop while dragging or previewing                                      X
 * - stop raf loop if not dragging or previewing and start it on play, drag or preview   X
 * - try to not use css variables
 */

export class VideoPlayer {
  private video: HTMLVideoElement | null = null;
  private videoContainer: HTMLDivElement | null = null;
  private sliderContainer: HTMLDivElement | null = null;
  private timerEl: HTMLSpanElement | null = null;
  private durationEl: HTMLSpanElement | null = null;
  private playButton: HTMLButtonElement | null = null;
  private fullscreenButton: HTMLButtonElement | null = null;
  private sliderFill: HTMLDivElement | null = null;
  private sliderButton: HTMLDivElement | null = null;
  private previewTimer: HTMLSpanElement | null = null;
  private previewContainer: HTMLDivElement | null = null;

  private rafId: number | null = null;
  private vfrcId: number | null = null;

  private lastVolume: number = 1;
  private lastFloorCt: number | null = null;
  private lastPreviewFloorCt: number | null = null;

  private previewX = 0;
  private sliderWidth = 0;
  private invSliderWidth = 0;

  private progressX = 0;

  private wasPlaying = false;
  private isScrubbing = false;
  private isFullscreen = false;
  private isHoveringPreview = false;
  private isHoveringPlayer = false;
  // private volume = 1;
  // private muted = false;
  private currentTime = 0;
  private duration = 0;
  private paused = true;
  private ended = false;

  private invDuration = 0;

  private resizeObserver: ResizeObserver | null = null;

  private state: VideoPlayerControllerState = {
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: 0,
    paused: true,
    ended: false,
    isFullscreen: false,
    previewTime: null,
  };
  private listeners = new Set<() => void>();

  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  /** Notify listeners */
  private notify = () => {
    this.listeners.forEach((l) => l());
  };

  public getSnapshot = () => this.state;

  public attach = (
    video: HTMLVideoElement,
    videoContainer: HTMLDivElement,
    sliderContainer: HTMLDivElement,
    timerEl: HTMLSpanElement,
    durationEl: HTMLSpanElement,
    playButton: HTMLButtonElement,
    fullscreenButton: HTMLButtonElement,
    sliderFill: HTMLDivElement,
    sliderButton: HTMLDivElement,
    previewTimer: HTMLSpanElement,
    previewContainer: HTMLDivElement,
  ) => {
    this.video = video;
    this.videoContainer = videoContainer;
    this.sliderContainer = sliderContainer;
    this.timerEl = timerEl;
    this.durationEl = durationEl;
    this.playButton = playButton;
    this.fullscreenButton = fullscreenButton;
    this.sliderFill = sliderFill;
    this.sliderButton = sliderButton;
    this.previewTimer = previewTimer;
    this.previewContainer = previewContainer;

    const { volume, muted } = getSessionVolumeState();
    this.lastVolume = volume;
    this.state.volume = volume;
    this.state.muted = muted;
    this.video.volume = volume;
    this.video.muted = muted;
    this.sliderWidth = this.sliderContainer.clientWidth;
    this.invSliderWidth = 1 / this.sliderWidth;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.sliderContainer) {
          this.sliderWidth = entry.contentRect.width;
          this.invSliderWidth = 1 / this.sliderWidth;

          if (this.video && (this.paused || this.ended)) {
            this.updateSliderPosition(this.video.currentTime);
          }
        }
      }
    });
    this.resizeObserver.observe(this.sliderContainer);

    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata);
    this.video.addEventListener('play', this.onPlay);
    this.video.addEventListener('pause', this.onPause);
    this.video.addEventListener('volumechange', this.onVolumeChange);
    this.video.addEventListener('timeupdate', this.onTimeUpdate);
    this.video.addEventListener('ended', this.onEnded);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  };

  public detach = () => {
    if (!this.video) return;

    this.stopRafLoop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.video.removeEventListener('loadedmetadata', this.onLoadedMetadata);
    this.video.removeEventListener('play', this.onPlay);
    this.video.removeEventListener('pause', this.onPause);
    this.video.removeEventListener('volumechange', this.onVolumeChange);
    this.video.removeEventListener('timeupdate', this.onTimeUpdate);
    this.video.removeEventListener('ended', this.onEnded);
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    if (this.vfrcId) this.video.cancelVideoFrameCallback(this.vfrcId);
    this.video = null;
    this.videoContainer = null;
    this.sliderContainer = null;
  };

  // #region Video controls
  /** Toggle play/pause */
  public togglePlay = () => {
    if (!this.video) return;
    if (this.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  };
  /** Toggle mute/unmute */
  public toggleMute = () => {
    if (!this.video) return;
    this.video.muted = !this.video.muted;
  };
  /** Set volume */
  public setVolume = (volume: number) => {
    if (!this.video) return;
    if (volume === 0) {
      this.video.volume = this.lastVolume;
      this.video.muted = true;
    } else {
      this.video.volume = volume;
      this.video.muted = false;
    }
  };
  /** Store last volume before setting volume */
  public startSettingVolume = () => {
    if (!this.video) return;
    this.lastVolume = this.video.volume;
  };
  /** Set preview X */
  public setPreviewX = (x: number) => {
    if (!this.sliderContainer) return;
    this.previewX = Math.min(
      Math.max(0, x - this.sliderContainer.offsetLeft),
      this.sliderContainer.clientWidth,
    );
  };
  /** Toggle fullscreen */
  public toggleFullscreen = () => {
    if (!this.videoContainer) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.videoContainer.requestFullscreen();
    }
  };
  /** Start scrubbing */
  public startScrubbing = () => {
    if (!this.video) return;
    this.isScrubbing = true;
    this.wasPlaying = !this.paused;
    if (this.ended) {
      this.ended = false;
      this.updatePlayButtonState();
    }
    if (this.wasPlaying) {
      this.video.pause();
    }
    this.startRafLoop();
  };
  /** Stop scrubbing */
  public stopScrubbing = () => {
    if (!this.video) return;

    this.isScrubbing = false;
    this.stopRafLoop();

    this.video.currentTime =
      this.previewX * this.invSliderWidth * this.video.duration;

    if (this.video.currentTime === this.video.duration) {
      this.ended = true;
    } else {
      this.ended = false;
    }

    this.updatePlayButtonState();

    if (this.wasPlaying) {
      this.video.play();
    }
  };

  public startHoveringPreview = () => {
    this.isHoveringPreview = true;
    this.startRafLoop();
  };
  public stopHoveringPreview = () => {
    this.isHoveringPreview = false;
    this.stopRafLoop();
  };

  public startHoveringPlayer = () => {
    this.isHoveringPlayer = true;
    // this.startRafLoop();
    if (!this.video) return;
    this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
  };
  public stopHoveringPlayer = () => {
    this.isHoveringPlayer = false;
    if (this.vfrcId) {
      this.video?.cancelVideoFrameCallback(this.vfrcId);
    }
    // this.stopRafLoop();
  };
  // #endregion

  // #region Events handlers
  /** Handle fullscreen change */
  private onFullscreenChange = () => {
    this.isFullscreen = document.fullscreenElement !== null;
    this.updateFullscreenButtonState();
  };
  /** Handle loaded metadata */
  private onLoadedMetadata = () => {
    if (!this.video || !this.timerEl || !this.durationEl) return;
    this.invDuration = 1 / this.video.duration;
    this.updateTimerContent(this.video.currentTime);
    this.durationEl.textContent = formatCt(this.video.duration);
  };
  /** Handle ended */
  private onEnded = () => {
    if (!this.video) return;
    this.ended = true;
    this.updatePlayButtonState();
    if (this.vfrcId) {
      this.video.cancelVideoFrameCallback(this.vfrcId);
    }
  };
  /** Handle pause */
  private onPause = () => {
    this.paused = true;
    this.updatePlayButtonState();

    if (this.vfrcId && this.video) {
      this.video.cancelVideoFrameCallback(this.vfrcId);
    }
  };
  /** Handle play */
  private onPlay = () => {
    if (!this.video) return;
    this.paused = false;
    this.ended = false;
    this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
    this.updatePlayButtonState();
  };
  /** Handle volume change */
  private onVolumeChange = () => {
    if (!this.video) return;
    this.state.volume = this.video.muted ? 0 : this.video.volume;
    this.state.muted = this.video.muted;
    setSessionVolumeState({
      volume: this.video.muted ? this.lastVolume : this.video.volume,
      muted: this.video.muted,
    });
    // this.notify();
  };
  /** Handle time update */
  private onTimeUpdate = () => {
    if (!this.video) return;
    this.updateTimerContent(this.video.currentTime);
  };
  // #endregion

  // #region Internal methods
  /** Start raf loop */
  private startRafLoop = () => {
    this.rafId = requestAnimationFrame(this.rafLoop);
  };
  /** Raf loop used for the scrubbing and preview only */
  private rafLoop = () => {
    if (
      !this.video ||
      !this.sliderFill ||
      !this.sliderButton ||
      !this.previewContainer ||
      !this.canLoop()
    )
      return;

    if (this.isScrubbing) {
      const scale = this.previewX * this.invSliderWidth;
      this.sliderButton.style.transform = `translateX(${this.previewX}px) translateX(-50%)`;
      this.sliderFill.style.transform = `scaleX(${scale})`;
      const timer = scale * this.video.duration;
      this.updateTimerContent(timer);

      this.previewContainer.style.transform = `translate3d(clamp(80px, ${this.previewX}px, calc(100cqi - 80px)),0,0)`;
      this.updatePreviewTimerContent(timer);
    } else if (this.isHoveringPreview) {
      this.previewContainer.style.transform = `translate3d(clamp(80px, ${this.previewX}px, calc(100cqi - 80px)),0,0)`;
      const scale = this.previewX * this.invSliderWidth;
      this.updatePreviewTimerContent(scale * this.video.duration);
    }

    this.rafId = requestAnimationFrame(this.rafLoop);
  };
  private canLoop = () => {
    return this.isScrubbing || this.isHoveringPreview;
  };
  /** Stop raf loop */
  private stopRafLoop = () => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };
  /** Update timer content
   * @param t time in seconds
   */
  private updateTimerContent = (t: number) => {
    if (!this.timerEl) return;
    const ct = Math.floor(t);
    if (ct === this.lastFloorCt) return;
    this.lastFloorCt = ct;
    this.timerEl.textContent = formatCt(t);
  };

  /** Update preview timer content
   * @param t time in seconds
   */
  private updatePreviewTimerContent = (t: number) => {
    if (!this.previewTimer) return;
    const ct = Math.floor(t);
    if (ct === this.lastPreviewFloorCt) return;
    this.lastPreviewFloorCt = ct;
    this.previewTimer.textContent = formatCt(t);
  };

  /** Update play button state */
  private updatePlayButtonState = () => {
    if (!this.playButton) return;
    this.playButton.dataset.state = this.ended
      ? 'ended'
      : this.paused
        ? 'paused'
        : 'playing';
  };

  private updateFullscreenButtonState = () => {
    if (!this.fullscreenButton) return;
    this.fullscreenButton.dataset.state = this.isFullscreen ? 'open' : 'close';
  };

  private vfrc: VideoFrameRequestCallback = (now, metadata) => {
    if (!this.sliderButton || !this.sliderFill || !this.video) return;
    this.updateSliderPosition(metadata.mediaTime);
    if (this.isHoveringPlayer) {
      this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
    }
  };

  private updateSliderPosition = (t: number) => {
    if (!this.sliderFill || !this.sliderButton) return;
    const scale = t * this.invDuration;
    const pos = scale * this.sliderWidth;
    this.sliderFill.style.transform = `scaleX(${scale})`;
    this.sliderButton.style.transform = `translateX(${pos}px)`;
  };
  // #endregion
}
