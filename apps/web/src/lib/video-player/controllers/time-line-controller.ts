import type { interactionFeature } from '@repo/video-player/feature/core/interaction';
import type { playbackFeature } from '@repo/video-player/feature/core/playback';
import type {
  Cue,
  storyboardFeature,
} from '@repo/video-player/feature/core/storyboard';
import type { timeFeature } from '@repo/video-player/feature/core/time';
import type { Player } from '@repo/video-player/player/player';

interface TimeLineControllerElements {
  timeLineContainer: HTMLDivElement;
  previewImage: HTMLImageElement;
  previewTimer: HTMLOutputElement;
}

export class TimeLineController {
  private video: HTMLVideoElement | null = null;
  private elements: TimeLineControllerElements | null = null;
  private ctx;

  private vfrcEffectDisposer: (() => void) | null = null;
  private bufferedEffectDisposer: (() => void) | null = null;
  private activeCueEffectDisposer: (() => void) | null = null;

  private lastPreloadedAt: number = 0;

  private vfrcId: number | null = null;
  private rafId: number | null = null;
  private wasPlaying = false;
  private isScrubbing = false;
  private isHovering = false;
  private previewX = 0;
  private timeLineContainerOffsetLeft = 0;
  private timeLineContainerWidth = 0;
  private invTimeLineContainerWidth = 0;

  private observer: ResizeObserver | null = null;

  constructor(
    context: ReturnType<
      Player<
        [
          typeof timeFeature,
          typeof interactionFeature,
          typeof playbackFeature,
          typeof storyboardFeature,
        ]
      >['getControllerContext']
    >,
  ) {
    this.ctx = context;
  }

  public attach = (
    video: HTMLVideoElement,
    elements: TimeLineControllerElements,
  ) => {
    this.video = video;
    this.elements = elements;
    this.initObservers();
    this.initContainerListener();
    this.vfrcEffectDisposer = this.ctx.effect(() => {
      const shouldPlay =
        !this.ctx.state.playback.paused() &&
        !this.ctx.state.playback.ended() &&
        this.ctx.state.interaction.isActive();
      if (shouldPlay) {
        this.startVFRC();
      } else {
        // sync if ended or paused
        if (this.video) {
          this.updatePosition(this.video.currentTime);
        }
        this.stopVFRC();
      }
    });
    this.bufferedEffectDisposer = this.ctx.effect(() => {
      const bufferedEnd = this.ctx.state.time.bufferedEnd();
      this.updateBuffered(bufferedEnd);
    });
    this.activeCueEffectDisposer = this.ctx.effect(() => {
      const activeCue = this.ctx.state.storyboard.activeCue();
      this.updateActiveCue(activeCue);
    });
  };

  public detach = () => {
    if (this.vfrcEffectDisposer) {
      this.vfrcEffectDisposer();
      this.vfrcEffectDisposer = null;
    }
    if (this.bufferedEffectDisposer) {
      this.bufferedEffectDisposer();
      this.bufferedEffectDisposer = null;
    }
    if (this.activeCueEffectDisposer) {
      this.activeCueEffectDisposer();
      this.activeCueEffectDisposer = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.vfrcId) {
      cancelAnimationFrame(this.vfrcId);
      this.vfrcId = null;
    }
    this.removeContainerListener();
    this.isScrubbing = false;
    this.isHovering = false;
    this.previewX = 0;
    this.timeLineContainerOffsetLeft = 0;
    this.timeLineContainerWidth = 0;
    this.invTimeLineContainerWidth = 0;
    this.elements = null;
    this.video = null;
    this.rafId = null;
    this.vfrcId = null;
  };

  private initObservers = () => {
    if (!this.elements) return;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.elements?.timeLineContainer) {
          this.timeLineContainerWidth = entry.contentRect.width;
          this.invTimeLineContainerWidth = 1 / this.timeLineContainerWidth;
          this.timeLineContainerOffsetLeft =
            entry.target.getBoundingClientRect().left;
        }
      }
    });
    this.observer.observe(this.elements.timeLineContainer);
  };

  private initContainerListener = () => {
    if (!this.elements) return;
    this.elements.timeLineContainer.addEventListener(
      'pointerenter',
      this.onPointerEnter,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointerleave',
      this.onPointerLeave,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointermove',
      this.onPointerMove,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointerdown',
      this.onPointerDown,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointerup',
      this.onPointerUp,
    );
  };

  private removeContainerListener = () => {
    if (!this.elements) return;
    this.elements.timeLineContainer.removeEventListener(
      'pointerenter',
      this.onPointerEnter,
    );
    this.elements.timeLineContainer.removeEventListener(
      'pointerleave',
      this.onPointerLeave,
    );
    this.elements.timeLineContainer.removeEventListener(
      'pointermove',
      this.onPointerMove,
    );
    this.elements.timeLineContainer.removeEventListener(
      'pointerdown',
      this.onPointerDown,
    );
    this.elements.timeLineContainer.removeEventListener(
      'pointerup',
      this.onPointerUp,
    );
  };

  private onPointerMove = (e: PointerEvent) => {
    this.setPreviewX(e.clientX);
  };

  private onPointerEnter = () => {
    this.isHovering = true;
    this.startRafLoop();
  };

  private onPointerLeave = () => {
    this.isHovering = false;
    this.stopRafLoop();
  };

  private onPointerDown = (e: PointerEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    this.isScrubbing = true;
    const paused = this.ctx.state.playback.paused();
    const ended = this.ctx.state.playback.ended();
    this.wasPlaying = !paused && !ended;
    if (this.wasPlaying) this.ctx.apis.playback.pause();
  };

  private onPointerUp = (e: PointerEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.releasePointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    this.isScrubbing = false;
    this.ctx.apis.playback.seek(
      this.previewX *
        this.invTimeLineContainerWidth *
        this.ctx.state.time.duration(),
    );
    if (this.wasPlaying) this.ctx.apis.playback.play();
  };

  private setPreviewX = (x: number) => {
    this.previewX = Math.max(
      0,
      Math.min(
        this.timeLineContainerWidth,
        x - this.timeLineContainerOffsetLeft,
      ),
    );
  };

  private rafLoop = () => {
    const duration = this.ctx.state.time.duration();
    if ((!this.isScrubbing && !this.isHovering) || duration <= 0) return;
    if (this.isScrubbing) {
      const scale = this.previewX * this.invTimeLineContainerWidth;
      this.elements?.timeLineContainer.style.setProperty(
        '--pointerpx',
        this.previewX + 'px',
      );
      this.elements?.timeLineContainer.style.setProperty(
        '--fillpx',
        this.previewX + 'px',
      );
      this.elements?.timeLineContainer.style.setProperty(
        '--fill',
        String(scale),
      );
      this.ctx.apis.time.setCurrentTimeFromRatio(scale);
      const time = duration * scale;
      if (this.elements?.previewTimer) {
        this.elements.previewTimer.textContent = formatTime(time);
      }
      if (this.elements?.previewImage) {
        this.ctx.apis.storyboard.setActiveCue(time);
      }
      const now = performance.now();
      if (now - this.lastPreloadedAt > 200) {
        this.ctx.apis.time.preload(time);
        this.lastPreloadedAt = now;
      }
    } else if (this.isHovering) {
      const scale = this.previewX * this.invTimeLineContainerWidth;
      this.elements?.timeLineContainer.style.setProperty(
        '--pointerpx',
        this.previewX + 'px',
      );
      const time = duration * scale;
      if (this.elements?.previewTimer) {
        this.elements.previewTimer.textContent = formatTime(time);
      }
      if (this.elements?.previewImage) {
        this.ctx.apis.storyboard.setActiveCue(time);
      }
    }
    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  private startRafLoop = () => {
    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  private stopRafLoop = () => {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  private updatePosition = (t: number) => {
    if (!this.elements?.timeLineContainer) return;
    const invDuration = this.ctx.state.time.invDuration();
    const fillpercent = t * invDuration;
    const fillpx = fillpercent * this.timeLineContainerWidth;
    this.elements.timeLineContainer.style.setProperty(
      '--fill',
      String(fillpercent),
    );
    this.elements.timeLineContainer.style.setProperty(
      '--fillpx',
      String(fillpx) + 'px',
    );
  };

  private updateActiveCue = (cue: Cue | null) => {
    const img = this.elements?.previewImage;
    if (!img || !cue) return;

    if (img.src !== cue.img) {
      img.src = cue.img;
    }

    img.style.width = `${cue.w * 5}px`;
    img.style.height = `${cue.h * 5}px`;

    img.style.transform = `translate3d(${-cue.x}px, ${-cue.y}px, 0)`;
  };

  private updateBuffered = (buffered: number) => {
    if (!this.elements?.timeLineContainer) return;
    const invDuration = this.ctx.state.time.invDuration();
    const percent = buffered * invDuration;
    this.elements.timeLineContainer.style.setProperty(
      '--buffered',
      String(percent),
    );
  };

  private vfrc: VideoFrameRequestCallback = (_, metadata) => {
    if (!this.video) return;
    this.updatePosition(metadata.mediaTime);
    const shouldKeep =
      !this.ctx.state.playback.paused() &&
      !this.ctx.state.playback.ended() &&
      this.ctx.state.interaction.isActive();
    if (!shouldKeep) return;
    this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
  };

  private startVFRC = () => {
    if (!this.video) return;
    this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
  };

  private stopVFRC = () => {
    if (!this.video) return;
    if (!this.vfrcId) return;
    this.video.cancelVideoFrameCallback(this.vfrcId);
    this.vfrcId = null;
  };
}

function formatTime(time: number) {
  if (!Number.isFinite(time)) return '--:--';
  const rounded = Math.round(time);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = Math.floor(rounded % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
