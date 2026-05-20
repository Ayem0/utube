import { VideoPlayer } from '@repo/video-player/video-player';
import { PlayingState } from './video-player-controller';
import { formatCt } from './video-player-utils';

interface VideoPlayerUIDesktopElements {
  videoContainer: HTMLDivElement;
  sliderContainer: HTMLDivElement;
  timerEl: HTMLSpanElement;
  durationEl: HTMLSpanElement;
  playButton: HTMLButtonElement;
  fullscreenButton: HTMLButtonElement;
  sliderFill: HTMLDivElement;
  sliderButton: HTMLDivElement;
  previewTimer: HTMLSpanElement;
  previewContainer: HTMLDivElement;
  muteButton: HTMLButtonElement;
}
export class VideoPlayerUIDesktop {
  public toggleFullscreen = () => {
    if (!this.elements) return;
    if (document.fullscreenElement === this.elements.videoContainer) {
      document.exitFullscreen();
    } else {
      this.elements.videoContainer.requestFullscreen();
    }
  };
  private lastVolume = 0;
  public startSettingVolume = () => {
    this.lastVolume = this.videoPlayer.video.volume;
  };
  public setVolume = (v: number) => {
    this.videoPlayer.setVolume(v);
  };
  public toggleMute = () => {
    this.videoPlayer.setVolume(
      this.videoPlayer.video.volume === 0 ? this.lastVolume : 0,
    );
  };

  public togglePlay = () => {
    if (!this.videoPlayer) return;
    if (this.isPlaying) {
      this.videoPlayer.pause();
    } else {
      this.videoPlayer.play();
    }
  };

  private videoPlayer: VideoPlayer;
  private elements: VideoPlayerUIDesktopElements;
  private sliderObserver: ResizeObserver;
  private containerObserver: ResizeObserver;

  private sliderWidth: number = 0;
  private invSliderWidth: number = 0;
  private sliderOffsetLeft: number = 0;

  private isFullscreen = false;
  private isPlaying = false;
  private isEnded = false;

  private _isMenuOpen = false;

  get isMenuOpen() {
    return this._isMenuOpen;
  }

  private _isHoveringPreview = false;
  private isHoveringPlayer = false;

  get isHoveringPreview() {
    return this._isHoveringPreview;
  }

  private rafId: number | null = null;
  private vfrcId: number | null = null;

  private previewX: number = 0;
  private isScrubbing = false;

  private duration = 0;
  private invDuration: number = 0;
  /**
   *
   */
  constructor(
    videoPlayer: VideoPlayer,
    elements: VideoPlayerUIDesktopElements,
  ) {
    this.videoPlayer = videoPlayer;
    this.elements = elements;

    this.sliderOffsetLeft = this.elements.sliderContainer.offsetLeft;
    this.sliderWidth = this.elements.sliderContainer.clientWidth;
    this.invSliderWidth = 1 / this.sliderWidth;

    this.sliderObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.elements?.sliderContainer) {
          this.sliderWidth = entry.contentRect.width;
          this.invSliderWidth = 1 / this.sliderWidth;
          this.sliderOffsetLeft = entry.target.getBoundingClientRect().left;

          if (!this.videoPlayer?.video) return;

          if (this.videoPlayer.video.paused || this.videoPlayer.video.ended) {
            this.updateSliderPosition(this.videoPlayer.video.currentTime);
          }
        }
      }
    });
    this.sliderObserver.observe(this.elements.sliderContainer);

    this.containerObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.elements?.videoContainer) {
          if (!this.videoPlayer?.video) return;
          this.videoPlayer.video.style.height = `${this.elements.videoContainer.clientHeight}px`;
          this.videoPlayer.video.style.width = `${this.elements.videoContainer.clientWidth}px`;
        }
      }
    });
    this.containerObserver.observe(this.elements.videoContainer);

    this.initListeners();
  }

  // public init =

  private initListeners = () => {
    if (!this.videoPlayer || !this.elements) return;
    this.videoPlayer.on('timeChange', this.updateTimerContent);
    this.videoPlayer.on('ended', this.onEnded);
    this.videoPlayer.on('pause', this.onPause);
    this.videoPlayer.on('play', this.onPlay);
    this.videoPlayer.on('volumeChange', this.updateVolumeState);
    this.videoPlayer.on('qualitiesLoaded', this.updateQualities);

    // this.videoPlayer.on('playingStateChange', this.onPlayingStateChange);
    // this.videoPlayer.on('previewTimeChange', this.updatePreviewTimerContent);
    // this.videoPlayer.on('durationChange', this.updateDurationContent);

    this.elements.videoContainer.addEventListener(
      'fullscreenchange',
      this.onFullscreenChange,
    );
  };

  private onPause = () => {
    if (!this.elements || !this.videoPlayer?.video) return;
    this.isPlaying = false;
    this.isEnded = false;
    this.updatePlayButtonState(PlayingState.Paused);
    this.stopVfrc();
  };

  private onPlay = () => {
    if (!this.elements || !this.videoPlayer?.video) return;
    this.isEnded = false;
    this.isPlaying = true;
    this.updatePlayButtonState(PlayingState.Playing);
    if (this.isHoveringPlayer) {
      this.startVfrc();
    }
  };

  private onEnded = () => {
    if (!this.videoPlayer?.video) return;
    this.isPlaying = false;
    this.isEnded = true;
    this.updatePlayButtonState(PlayingState.Ended);
    this.updateSliderPosition(this.videoPlayer.video.duration);
    this.stopVfrc();
  };

  public destroy = () => {
    if (!this.videoPlayer || !this.elements) return;
    // this.videoPlayer.off('playingStateChange', this.onPlayingStateChange);
    this.videoPlayer.off('timeChange', this.updateTimerContent);
    this.videoPlayer.off('volumeChange', this.updateVolumeState);
    this.videoPlayer.off('qualitiesLoaded', this.updateQualities);
    this.videoPlayer.off('ended', this.onEnded);
    this.videoPlayer.off('pause', this.onPause);
    this.videoPlayer.off('play', this.onPlay);
    // this.videoPlayer.off('previewTimeChange', this.updatePreviewTimerContent);
    // this.videoPlayer.off('durationChange', this.updateDurationContent);

    this.elements.videoContainer.removeEventListener(
      'fullscreenchange',
      this.onFullscreenChange,
    );

    this.containerObserver.disconnect();
    this.sliderObserver.disconnect();
    this.videoPlayer.destroy();
  };

  /** Update timer content
   * @param t time in seconds
   */
  private updateTimerContent = (t: number) => {
    if (!this.elements) return;
    this.elements.timerEl.textContent = formatCt(t);
  };

  /** Update preview timer content
   * @param t time in seconds
   */
  private updatePreviewTimerContent = (t: number) => {
    if (!this.elements) return;
    this.elements.previewTimer.textContent = formatCt(t);
  };

  private updateDurationContent = (t: number) => {
    if (!this.elements) return;
    this.duration = t;
    this.invDuration = 1 / t;
    this.elements.durationEl.textContent = formatCt(t);
  };

  /** Update play button state */
  private updatePlayButtonState = (state: PlayingState) => {
    if (!this.elements || !this.videoPlayer?.video) return;
    this.elements.playButton.dataset.state =
      state === PlayingState.Ended
        ? 'ended'
        : state === PlayingState.Paused
          ? 'paused'
          : 'playing';
  };

  private updateFullscreenButtonState = () => {
    if (!this.elements) return;
    this.elements.fullscreenButton.dataset.state = this.isFullscreen
      ? 'open'
      : 'close';
  };

  private onFullscreenChange = () => {
    this.isFullscreen = document.fullscreenElement !== null;
    if (!this.elements) return;
    this.elements.videoContainer.dataset.fullscreen = this.isFullscreen
      ? 'true'
      : 'false';
    this.updateFullscreenButtonState();
  };

  private vfrc: VideoFrameRequestCallback = (_, metadata) => {
    // check for this.vfrcId to prevent ghost callbacks (not cancelled for some dark reason)
    if (!this.videoPlayer?.video || !this.vfrcId) return;
    this.updateSliderPosition(metadata.mediaTime);
    if (this.isHoveringPlayer && this.isPlaying) {
      this.vfrcId = this.videoPlayer.video.requestVideoFrameCallback(this.vfrc);
    }
  };

  private updateSliderPosition = (t: number) => {
    if (!this.elements) return;
    const scale = t * this.invDuration;
    const pos = scale * this.sliderWidth;
    this.elements.sliderFill.style.transform = `scaleX(${scale})`;
    this.elements.sliderButton.style.transform = `translateX(${pos}px)`;
  };

  private updateVolumeState = (volume: number) => {
    if (!this.elements) return;
    this.elements.muteButton.dataset.state =
      volume === 0 ? 'muted' : volume >= 0.5 ? 'high' : 'low';
  };

  public setPreviewX = (x: number) => {
    this.previewX = Math.min(
      Math.max(0, x - this.sliderOffsetLeft),
      this.sliderWidth,
    );
  };

  public startHoveringPreview = () => {
    this._isHoveringPreview = true;
    this.startRafLoop();
  };

  public stopHoveringPreview = () => {
    this._isHoveringPreview = false;
    this.stopRafLoop();
  };

  public startHoveringPlayer = () => {
    this.isHoveringPlayer = true;
    this.updateContainerActive();
    if (!this.videoPlayer) return;
    if (this.isPlaying) {
      this.startVfrc();
    }
  };

  private updateContainerActive = () => {
    if (!this.elements?.videoContainer) return;
    this.elements.videoContainer.dataset.active = this.isHoveringPlayer
      ? 'true'
      : 'false';
  };

  public stopHoveringPlayer = () => {
    this.isHoveringPlayer = false;
    if (!this._isMenuOpen) {
      this.updateContainerActive();
      this.stopVfrc();
    }
  };

  public startScrubbing = () => {
    if (!this.videoPlayer) return;
    this.isScrubbing = true;
    this.stopVfrc();
    // this.videoPlayer.startScrubbing();
    this.startRafLoop();
  };

  /** Stop scrubbing */
  public stopScrubbing = () => {
    if (!this.videoPlayer) return;
    this.isScrubbing = false;
    this.stopRafLoop();
    const ratio = this.previewX * this.invSliderWidth;
    this.videoPlayer.seek(ratio);
  };

  private startVfrc = () => {
    if (!this.videoPlayer?.video || this.vfrcId !== null) return;
    this.vfrcId = this.videoPlayer.video.requestVideoFrameCallback(this.vfrc);
  };

  public openMenu = () => {
    this._isMenuOpen = true;
  };

  public closeMenu = () => {
    this._isMenuOpen = false;
  };

  private stopVfrc = () => {
    if (!this.videoPlayer?.video || !this.vfrcId) return;
    this.videoPlayer.video.cancelVideoFrameCallback(this.vfrcId);
    this.vfrcId = null;
  };

  private startRafLoop = () => {
    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  private stopRafLoop = () => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  /** Raf loop used for the scrubbing and preview only */
  private rafLoop = () => {
    if (!this.canLoop() || !this.elements) return;

    if (this.isScrubbing) {
      const scale = this.previewX * this.invSliderWidth;
      this.elements.sliderButton.style.transform = `translateX(${this.previewX}px)`;
      this.elements.sliderFill.style.transform = `scaleX(${scale})`;
      this.elements.previewContainer.style.transform = `translate3d(clamp(80px, ${this.previewX}px, calc(100cqi - 80px)),0,0)`;
      const time = scale * this.duration;
      this.updatePreviewTimerContent(time);
      this.updateTimerContent(time);
    } else if (this._isHoveringPreview) {
      this.elements.previewContainer.style.transform = `translate3d(clamp(80px, ${this.previewX}px, calc(100cqi - 80px)),0,0)`;
      const scale = this.previewX * this.invSliderWidth;
      this.updatePreviewTimerContent(scale * this.duration);
    }

    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  private canLoop = () => {
    return (this.isScrubbing || this._isHoveringPreview) && this.duration > 0;
  };

  private updateQualities = (
    qualities: Array<{ index: number; height: number; frameRate: number }>,
  ) => {
    if (!this.elements) return;
    console.log('qualities', qualities);
  };
}
